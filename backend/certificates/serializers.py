from rest_framework import serializers
from .models import Certificate

class CertificateSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField() # Backward compat
    course_title = serializers.CharField(source='course.title', read_only=True)
    author_name = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField() # Backward compat
    category_name = serializers.CharField(source='course.category.name', read_only=True, default='General')

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_id', 'verification_code', 'issue_date',
            'grade', 'is_valid', 'user', 'user_name', 'student_name',
            'course', 'course_title', 'author_name', 'instructor_name', 'category_name'
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_student_name(self, obj):
        return self.get_user_name(obj)

    def get_author_name(self, obj):
        author = obj.course.author
        return f"{author.first_name} {author.last_name}".strip() or author.username

    def get_instructor_name(self, obj):
        return self.get_author_name(obj)

class PublicVerifyCertificateSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    author_name = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'certificate_id', 'verification_code', 'issue_date',
            'grade', 'is_valid', 'user_name', 'student_name',
            'course_title', 'author_name', 'instructor_name'
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_student_name(self, obj):
        return self.get_user_name(obj)

    def get_author_name(self, obj):
        author = obj.course.author
        return f"{author.first_name} {author.last_name}".strip() or author.username

    def get_instructor_name(self, obj):
        return self.get_author_name(obj)
