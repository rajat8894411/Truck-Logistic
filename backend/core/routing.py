from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tracking/(?P<order_id>[^/]+)/$', consumers.TrackingConsumer.as_asgi()),
]
