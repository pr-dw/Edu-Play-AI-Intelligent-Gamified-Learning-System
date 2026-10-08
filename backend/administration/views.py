from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count
from users.models import User
from users.serializers import UserSerializer
from courses.models import Course, Lesson, Category, Enrollment
from certificates.models import Certificate
from tutor.models import TutorSession, TutorMessage
from .models import PlatformSetting

User = get_user_model()

class AdminOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        total_users = User.objects.count()
        users_count = User.objects.filter(role='user').count()
        admins_count = User.objects.filter(role='admin').count()

        total_courses = Course.objects.count()
        published_courses = Course.objects.filter(is_published=True).count()
        total_lessons = Lesson.objects.count()

        total_enrollments = Enrollment.objects.count()
        completed_enrollments = Enrollment.objects.filter(is_completed=True).count()
        completion_rate = round((completed_enrollments / total_enrollments * 100), 1) if total_enrollments > 0 else 0.0

        certificates_issued = Certificate.objects.count()

        total_tutor_sessions = TutorSession.objects.count()
        total_tutor_messages = TutorMessage.objects.count()
        ollama_messages = TutorMessage.objects.filter(provider_used='ollama').count()
        gemini_messages = TutorMessage.objects.filter(provider_used='gemini').count()

        default_provider = PlatformSetting.get_setting('DEFAULT_AI_PROVIDER', 'ollama')

        return Response({
            'overview': {
                'total_users': total_users,
                'users_count': users_count,
                'admins_count': admins_count,
                'total_courses': total_courses,
                'published_courses': published_courses,
                'total_lessons': total_lessons,
                'total_enrollments': total_enrollments,
                'completed_enrollments': completed_enrollments,
                'completion_rate': completion_rate,
                'certificates_issued': certificates_issued,
                'total_tutor_sessions': total_tutor_sessions,
                'total_tutor_messages': total_tutor_messages,
                'ollama_messages': ollama_messages,
                'gemini_messages': gemini_messages,
                'default_ai_provider': default_provider,
            },
            'recent_certificates': [
                {
                    'certificate_id': c.certificate_id,
                    'user_name': f"{c.user.first_name} {c.user.last_name}".strip() or c.user.username,
                    'course_title': c.course.title,
                    'issue_date': c.issue_date.strftime("%Y-%m-%d %H:%M"),
                }
                for c in Certificate.objects.select_related('user', 'course').order_by('-issue_date')[:5]
            ],
            'recent_users': [
                {
                    'id': u.id,
                    'username': u.username,
                    'role': u.role,
                    'points': u.points,
                    'date_joined': u.date_joined.strftime("%Y-%m-%d"),
                }
                for u in User.objects.order_by('-date_joined')[:5]
            ]
        })

class AdminUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all().order_by('-date_joined')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'name': f"{u.first_name} {u.last_name}".strip(),
                'role': u.role,
                'points': u.points,
                'level': u.level,
                'is_active': u.is_active,
                'date_joined': u.date_joined.strftime("%Y-%m-%d"),
            }
            for u in users
        ]
        return Response(data)

    def patch(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Only administrators can modify user roles and status.'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        role = request.data.get('role')
        is_active = request.data.get('is_active')

        try:
            target_user = User.objects.get(pk=user_id)
            if role in ('user', 'admin'):
                target_user.role = role
                if role == 'admin':
                    target_user.is_staff = True
                else:
                    target_user.is_staff = False
            if is_active is not None:
                target_user.is_active = bool(is_active)
            target_user.save()
            return Response({'message': f"User '{target_user.username}' updated successfully."})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class AdminCourseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        courses = Course.objects.all().select_related('category', 'author').annotate(
            enrollments_count=Count('enrollments')
        )
        data = [
            {
                'id': c.id,
                'title': c.title,
                'category': c.category.name if c.category else 'Uncategorized',
                'author': c.author.username,
                'level': c.level,
                'total_lessons': c.lessons.count(),
                'enrollments_count': c.enrollments_count,
                'is_published': c.is_published,
                'xp_reward': c.xp_reward,
                'created_at': c.created_at.strftime("%Y-%m-%d"),
            }
            for c in courses
        ]
        return Response(data)

    def post(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title')
        description = request.data.get('description', '')
        category_name = request.data.get('category', 'Technology')
        level = request.data.get('level', 'Beginner')
        xp_reward = int(request.data.get('xp_reward', 500))

        if not title:
            return Response({'error': 'Course title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        category, _ = Category.objects.get_or_create(name=category_name)
        course = Course.objects.create(
            title=title,
            description=description,
            category=category,
            author=request.user,
            level=level,
            xp_reward=xp_reward,
            is_published=True
        )

        return Response({
            'message': f"Course '{course.title}' created successfully.",
            'course_id': course.id,
        }, status=status.HTTP_201_CREATED)

    def patch(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        course_id = request.data.get('course_id')
        is_published = request.data.get('is_published')

        try:
            course = Course.objects.get(pk=course_id)
            if is_published is not None:
                course.is_published = bool(is_published)
                course.save(update_fields=['is_published'])
            return Response({'message': f"Course '{course.title}' status updated."})
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

class AdminSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        default_ai = PlatformSetting.get_setting('DEFAULT_AI_PROVIDER', 'ollama')
        site_title = PlatformSetting.get_setting('SITE_TITLE', 'EduPlay AI')
        announcement = PlatformSetting.get_setting('ANNOUNCEMENT', 'Welcome to EduPlay AI! Master concepts with our AI Tutor.')

        return Response({
            'DEFAULT_AI_PROVIDER': default_ai,
            'SITE_TITLE': site_title,
            'ANNOUNCEMENT': announcement,
        })

    def post(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'error': 'Only administrators can update platform settings.'}, status=status.HTTP_403_FORBIDDEN)

        for key in ['DEFAULT_AI_PROVIDER', 'SITE_TITLE', 'ANNOUNCEMENT']:
            if key in request.data:
                PlatformSetting.set_setting(key, request.data[key])

        return Response({'message': 'Platform settings updated successfully.'})

class AdminSeedDataView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .seed import seed_database
        result = seed_database()
        return Response(result)
