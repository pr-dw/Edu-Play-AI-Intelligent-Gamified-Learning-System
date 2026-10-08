from django.urls import path
from .views import ChatWithTutorView, TutorSessionListView, TutorSessionDetailView, TutorProviderStatusView

app_name = 'tutor'

urlpatterns = [
    path('chat/', ChatWithTutorView.as_view(), name='tutor_chat'),
    path('providers/', TutorProviderStatusView.as_view(), name='tutor_providers'),
    path('sessions/', TutorSessionListView.as_view(), name='tutor_sessions'),
    path('sessions/<int:id>/', TutorSessionDetailView.as_view(), name='tutor_session_detail'),
]
