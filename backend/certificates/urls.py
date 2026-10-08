from django.urls import path
from .views import MyCertificatesListView, ClaimCertificateView, VerifyCertificateView, DownloadCertificatePDFView

app_name = 'certificates'

urlpatterns = [
    path('', MyCertificatesListView.as_view(), name='my_certificates'),
    path('claim/<int:course_id>/', ClaimCertificateView.as_view(), name='claim_certificate'),
    path('verify/<str:cert_id>/', VerifyCertificateView.as_view(), name='verify_certificate'),
    path('download/<str:cert_id>/', DownloadCertificatePDFView.as_view(), name='download_certificate_pdf'),
]
