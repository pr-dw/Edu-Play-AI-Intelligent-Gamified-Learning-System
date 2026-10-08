import io
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .models import Certificate
from .serializers import CertificateSerializer, PublicVerifyCertificateSerializer
from courses.models import Course, Enrollment

class MyCertificatesListView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user).select_related('course', 'user', 'course__author')

class ClaimCertificateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        
        # Check enrollment and progress
        enrollment = Enrollment.objects.filter(user=request.user, course=course).first()
        if not enrollment:
            return Response({
                'error': f"You are not enrolled in '{course.title}'."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update and check progress
        enrollment.update_progress()
        if enrollment.progress_percentage < 100.0 and not enrollment.is_completed:
            return Response({
                'error': f"Course criteria not met. Current progress is {enrollment.progress_percentage}%. You must complete 100% of the lessons.",
                'progress_percentage': enrollment.progress_percentage
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create certificate
        cert, created = Certificate.objects.get_or_create(
            user=request.user,
            course=course
        )

        if created:
            # Award certificate achievement bonus XP (+200 XP)
            request.user.add_points(200)

        serializer = CertificateSerializer(cert, context={'request': request})
        return Response({
            'message': 'Congratulations! Certificate successfully generated!' if created else 'Certificate retrieved.',
            'certificate': serializer.data,
            'xp_awarded': 200 if created else 0,
            'user_points': request.user.points,
            'user_level': request.user.level,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class VerifyCertificateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, cert_id):
        # Lookup either by certificate_id or verification_code
        cert = Certificate.objects.filter(certificate_id__iexact=cert_id).first()
        if not cert:
            cert = Certificate.objects.filter(verification_code__iexact=cert_id).first()

        if not cert:
            return Response({
                'valid': False,
                'message': 'No certificate found matching the provided Certificate ID or Verification Code.'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PublicVerifyCertificateSerializer(cert)
        return Response({
            'valid': cert.is_valid,
            'message': 'Certificate authenticity successfully verified on EduPlay AI network.' if cert.is_valid else 'This certificate has been revoked.',
            'certificate': serializer.data
        })

class DownloadCertificatePDFView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, cert_id):
        cert = get_object_or_404(Certificate, certificate_id__iexact=cert_id)

        # Generate PDF using ReportLab
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)

        # Background & decorative border
        p.setFillColor(colors.HexColor('#0F172A')) # Deep slate
        p.rect(0, 0, width, height, fill=1, stroke=0)

        # Inner Gold Border
        p.setStrokeColor(colors.HexColor('#F59E0B')) # Amber
        p.setLineWidth(4)
        p.rect(24, 24, width - 48, height - 48, fill=0, stroke=1)

        # Accent Corner Frame
        p.setStrokeColor(colors.HexColor('#6366F1')) # Indigo
        p.setLineWidth(1.5)
        p.rect(32, 32, width - 64, height - 64, fill=0, stroke=1)

        # Header
        p.setFillColor(colors.HexColor('#38BDF8')) # Sky blue
        p.setFont("Helvetica-Bold", 14)
        p.drawCentredString(width / 2, height - 80, "EDUPLAY AI  •  OFFICIAL VERIFIED CREDENTIAL")

        # Title
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 32)
        p.drawCentredString(width / 2, height - 130, "CERTIFICATE OF COMPLETION")

        # Subtitle
        p.setFillColor(colors.HexColor('#94A3B8'))
        p.setFont("Helvetica", 14)
        p.drawCentredString(width / 2, height - 165, "This is proudly presented to")

        # Recipient Name
        recipient_name = f"{cert.user.first_name} {cert.user.last_name}".strip() or cert.user.username
        p.setFillColor(colors.HexColor('#FCD34D')) # Gold
        p.setFont("Helvetica-Bold", 28)
        p.drawCentredString(width / 2, height - 210, recipient_name)

        # Body text
        p.setFillColor(colors.HexColor('#CBD5E1'))
        p.setFont("Helvetica", 13)
        p.drawCentredString(width / 2, height - 250, "for successfully demonstrating mastery and completing all requirements for the course")

        # Course Title
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 20)
        p.drawCentredString(width / 2, height - 290, cert.course.title)

        # Details divider
        p.setStrokeColor(colors.HexColor('#334155'))
        p.setLineWidth(1)
        p.line(100, height - 325, width - 100, height - 325)

        # Footer Details
        p.setFont("Helvetica", 10)
        p.setFillColor(colors.HexColor('#94A3B8'))
        issue_date_str = cert.issue_date.strftime("%B %d, %Y")
        
        # Left: Date & ID
        p.drawString(100, height - 355, f"Date Issued: {issue_date_str}")
        p.drawString(100, height - 375, f"Certificate ID: {cert.certificate_id}")
        p.drawString(100, height - 395, f"Verification Code: {str(cert.verification_code)[:18]}...")

        # Right: Author / Board & Seal
        author_name = f"{cert.course.author.first_name} {cert.course.author.last_name}".strip() or cert.course.author.username
        p.drawRightString(width - 100, height - 355, f"Verified by: {author_name}")
        p.drawRightString(width - 100, height - 375, f"EduPlay AI Academic Board")
        p.drawRightString(width - 100, height - 395, "Status: Authenticated & Registered")

        p.showPage()
        p.save()

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="EduPlay_Certificate_{cert.certificate_id}.pdf"'
        return response
