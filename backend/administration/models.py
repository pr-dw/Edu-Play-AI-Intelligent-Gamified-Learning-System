from django.db import models

class PlatformSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

    @classmethod
    def get_setting(cls, key: str, default: str = '') -> str:
        setting = cls.objects.filter(key=key).first()
        return setting.value if setting else default

    @classmethod
    def set_setting(cls, key: str, value: str, description: str = ''):
        setting, _ = cls.objects.get_or_create(key=key)
        setting.value = str(value)
        if description:
            setting.description = description
        setting.save()
        return setting
