from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    return JsonResponse({
        'name': 'EduPlay AI API',
        'version': '1.0.0',
        'status': 'operational',
        'modules': {
            'user_management': '/api/users/',
            'course_management': '/api/courses/',
            'ai_personal_tutor': '/api/tutor/',
            'certificate_management': '/api/certificates/',
            'administration': '/api/admin/',
        },
        'supported_ai_providers': ['ollama (qwen2.5:3b)', 'google_gemini_api']
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api_root'),
    path('api/users/', include('users.urls', namespace='users')),
    path('api/courses/', include('courses.urls', namespace='courses')),
    path('api/tutor/', include('tutor.urls', namespace='tutor')),
    path('api/certificates/', include('certificates.urls', namespace='certificates')),
    path('api/admin/', include('administration.urls', namespace='administration')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
