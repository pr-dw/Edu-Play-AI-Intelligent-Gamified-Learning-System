from rest_framework import serializers
from .models import TutorSession, TutorMessage

class TutorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorMessage
        fields = ['id', 'role', 'content', 'provider_used', 'mode', 'created_at']

class TutorSessionSerializer(serializers.ModelSerializer):
    messages = TutorMessageSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, allow_null=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)

    class Meta:
        model = TutorSession
        fields = ['id', 'user', 'course', 'course_title', 'lesson', 'lesson_title', 'title', 'provider', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
