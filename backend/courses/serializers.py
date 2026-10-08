from rest_framework import serializers
from .models import Category, Course, Lesson, Enrollment, LessonProgress
from users.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    courses_count = serializers.IntegerField(source='courses.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'courses_count']

class LessonSummarySerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'slug', 'sequence_order', 'description', 'duration_minutes', 'xp_reward', 'is_completed']

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return LessonProgress.objects.filter(
            enrollment__user=request.user,
            enrollment__course=obj.course,
            lesson=obj,
            is_completed=True
        ).exists()

class LessonDetailSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    next_lesson_id = serializers.SerializerMethodField()
    prev_lesson_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'course_title', 'title', 'slug',
            'sequence_order', 'description', 'content',
            'duration_minutes', 'xp_reward', 'is_completed',
            'next_lesson_id', 'prev_lesson_id'
        ]

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return LessonProgress.objects.filter(
            enrollment__user=request.user,
            enrollment__course=obj.course,
            lesson=obj,
            is_completed=True
        ).exists()

    def get_next_lesson_id(self, obj):
        next_lesson = Lesson.objects.filter(
            course=obj.course,
            sequence_order__gt=obj.sequence_order
        ).order_by('sequence_order').first()
        return next_lesson.id if next_lesson else None

    def get_prev_lesson_id(self, obj):
        prev_lesson = Lesson.objects.filter(
            course=obj.course,
            sequence_order__lt=obj.sequence_order
        ).order_by('-sequence_order').first()
        return prev_lesson.id if prev_lesson else None

class CourseListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    author_name = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration = serializers.IntegerField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'category_name', 'category_icon',
            'author', 'author_name', 'instructor_name', 'level', 'thumbnail', 'xp_reward',
            'total_lessons', 'total_duration', 'is_published', 'created_at',
            'is_enrolled', 'progress_percentage'
        ]

    def get_author_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_instructor_name(self, obj):
        return self.get_author_name(obj)

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Enrollment.objects.filter(user=request.user, course=obj).exists()

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0.0
        enrollment = Enrollment.objects.filter(user=request.user, course=obj).first()
        return enrollment.progress_percentage if enrollment else 0.0

class CourseDetailSerializer(CourseListSerializer):
    lessons = LessonSummarySerializer(many=True, read_only=True)
    author_details = UserSerializer(source='author', read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ['lessons', 'author_details']

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    has_certificate = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ['id', 'user', 'course', 'enrolled_at', 'progress_percentage', 'is_completed', 'completed_at', 'has_certificate']

    def get_has_certificate(self, obj):
        return hasattr(obj.user, 'certificates') and obj.user.certificates.filter(course=obj.course).exists()
