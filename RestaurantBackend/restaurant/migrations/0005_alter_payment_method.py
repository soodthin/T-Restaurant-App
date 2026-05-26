from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0004_alter_dish_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='method',
            field=models.CharField(choices=[('cash', 'Tiền mặt khi nhận'), ('momo', 'MoMo'), ('stripe', 'Stripe')], max_length=20),
        ),
    ]
