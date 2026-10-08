from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Category, Course, Lesson, Enrollment, LessonProgress
from .serializers import (
    CategorySerializer, CourseListSerializer, CourseDetailSerializer,
    LessonDetailSerializer, EnrollmentSerializer
)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True).select_related('category', 'author')
        category = self.request.query_params.get('category')
        level = self.request.query_params.get('level')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category__slug=category)
        if level:
            queryset = queryset.filter(level=level)
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(description__icontains=search)
        return queryset

class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.all().prefetch_related('lessons')
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

class EnrollCourseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        enrollment, created = Enrollment.objects.get_or_create(
            user=request.user,
            course=course
        )
        if created:
            # Create progress placeholders for lessons
            for lesson in course.lessons.all():
                LessonProgress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
            # Award enrollment motivation XP (+25 XP)
            request.user.add_points(25)
            message = f"Successfully enrolled in {course.title}! +25 XP awarded!"
        else:
            message = f"You are already enrolled in {course.title}."

        return Response({
            'message': message,
            'enrollment_id': enrollment.id,
            'progress_percentage': enrollment.progress_percentage,
            'is_completed': enrollment.is_completed,
            'user_points': request.user.points,
            'user_level': request.user.level,
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

class LessonDetailView(generics.RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

class CompleteLessonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lesson = get_object_or_404(Lesson, pk=pk)
        enrollment, _ = Enrollment.objects.get_or_create(
            user=request.user,
            course=lesson.course
        )

        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson
        )

        already_completed = progress.is_completed
        if not already_completed:
            progress.is_completed = True
            progress.completed_at = timezone.now()
            progress.save()

            # Award lesson XP
            request.user.add_points(lesson.xp_reward)

        # Recalculate enrollment progress
        new_progress = enrollment.update_progress()

        # Check if course is now 100% completed
        is_now_complete = enrollment.is_completed

        return Response({
            'message': f"Lesson '{lesson.title}' marked as complete!" if not already_completed else "Lesson was already completed.",
            'xp_earned': lesson.xp_reward if not already_completed else 0,
            'course_progress': new_progress,
            'is_course_completed': is_now_complete,
            'total_user_points': request.user.points,
            'user_level': request.user.level,
        })

class MyCoursesView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Enrollment.objects.filter(user=self.request.user).select_related('course', 'course__category', 'course__author')
        completed = self.request.query_params.get('completed')
        if completed is not None:
            if completed.lower() in ('true', '1', 'yes'):
                queryset = queryset.filter(is_completed=True)
            elif completed.lower() in ('false', '0', 'no'):
                queryset = queryset.filter(is_completed=False)
        return queryset
