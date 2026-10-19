from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def inicio(request):
    return Response({
        'mensaje': 'API funcionando correctamente',
        'proyecto': 'Start_Point'
    })