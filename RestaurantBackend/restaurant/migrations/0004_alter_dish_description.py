import ckeditor.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0003_alter_order_status_alter_payment_method_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dish',
            name='description',
            field=ckeditor.fields.RichTextField(blank=True, null=True),
        ),
    ]
