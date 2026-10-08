from django.urls import path
from .views import (
    AdminOverviewView, AdminUserListView, AdminCourseListView,
    AdminCourseDetailView, AdminLessonCreateView, AdminLessonDetailView,
    AdminSettingsView, AdminSeedDataView
)

app_name = 'administration'

urlpatterns = [
    path('overview/', AdminOverviewView.as_view(), name='admin_overview'),
    path('users/', AdminUserListView.as_view(), name='admin_users'),
    path('courses/', AdminCourseListView.as_view(), name='admin_courses'),
    path('courses/<int:course_id>/', AdminCourseDetailView.as_view(), name='admin_course_detail'),
    path('courses/<int:course_id>/lessons/', AdminLessonCreateView.as_view(), name='admin_course_lessons'),
    path('lessons/<int:lesson_id>/', AdminLessonDetailView.as_view(), name='admin_lesson_detail'),
    path('settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('seed/', AdminSeedDataView.as_view(), name='admin_seed'),
]

