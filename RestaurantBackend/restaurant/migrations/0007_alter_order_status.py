from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0006_payment_pay_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('payment_failed', 'Payment Failed'), ('preparing', 'Preparing'), ('served', 'Served'), ('cancelled', 'Cancelled')], default='pending', max_length=20),
        ),
    ]
