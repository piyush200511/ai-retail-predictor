import io
import qrcode
from django.http import HttpResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Product


class ProductQRCodeView(APIView):
    """
    GET /api/products/<sku>/qrcode/
    Returns a PNG QR code for the product SKU.
    QR payload = the SKU itself (scanner will look up by SKU).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, sku):
        try:
            product = Product.objects.get(sku=sku)
        except Product.DoesNotExist:
            raise Http404("Product not found")

        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(product.sku)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type="image/png")