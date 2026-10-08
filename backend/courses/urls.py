from django.urls import path
from .views import (
    CategoryListView, CourseListView, CourseDetailView,
    EnrollCourseView, LessonDetailView, CompleteLessonView,
    MyCoursesView
)

app_name = 'courses'

urlpatterns = [
    path('', CourseListView.as_view(), name='course_list'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('my-courses/', MyCoursesView.as_view(), name='my_courses'),
    path('<int:id>/', CourseDetailView.as_view(), name='course_detail'),
    path('<int:pk>/enroll/', EnrollCourseView.as_view(), name='course_enroll'),
    path('lessons/<int:id>/', LessonDetailView.as_view(), name='lesson_detail'),
    path('lessons/<int:pk>/complete/', CompleteLessonView.as_view(), name='lesson_complete'),
]
