from django.core.management.base import BaseCommand
from restaurant.models import User, FoodCategory, Menu, Dish


class Command(BaseCommand):
    help = 'Seed sample data for restaurant app'

    def handle(self, *args, **options):
        # Migration: đổi tên record cũ (không dấu) sang tên mới (có dấu) nếu tồn tại.
        category_renames = {
            'Khai vi': 'Khai vị',
            'Mon chinh': 'Món chính',
            'Mon nuoc': 'Món nước',
            'Trang mieng': 'Tráng miệng',
            'Do uong': 'Đồ uống',
        }
        for old, new in category_renames.items():
            FoodCategory.objects.filter(name=old).update(name=new)

        menu_renames = {
            'Thuc don chinh': 'Thực đơn chính',
            'Do uong & Trang mieng': 'Đồ uống & Tráng miệng',
        }
        for old, new in menu_renames.items():
            Menu.objects.filter(name=old).update(name=new)

        dish_renames = {
            'Pho Bo Sai Gon': 'Phở Bò Sài Gòn',
            'Com Tam Suon Bi Cha': 'Cơm Tấm Sườn Bì Chả',
            'Bun Cha Ha Noi': 'Bún Chả Hà Nội',
            'Goi Cuon Tom Thit': 'Gỏi Cuốn Tôm Thịt',
            'Banh Xeo Mien Nam': 'Bánh Xèo Miền Nam',
            'Bo Luc Lac': 'Bò Lúc Lắc',
            'Canh Chua Ca Loc': 'Canh Chua Cá Lóc',
            'Che Ba Mau': 'Chè Ba Màu',
            'Ca Phe Sua Da': 'Cà Phê Sữa Đá',
            'Nuoc Chanh Muoi': 'Nước Chanh Muối',
        }
        for old, new in dish_renames.items():
            Dish.objects.filter(name=old).update(name=new)

        # Chef
        chef, created = User.objects.get_or_create(
            username='chef_minh',
            defaults={
                'first_name': 'Minh',
                'last_name': 'Nguyễn',
                'email': 'minh@saigonsavory.vn',
                'role': 'chef',
                'is_verified': True,
                'phone': '0901234567',
                'address': '371 Nguyễn Kiệm, Gò Vấp',
            },
        )
        # Cập nhật chef đã tồn tại (last_name + address có thể đang lưu không dấu).
        if not created:
            User.objects.filter(username='chef_minh').update(
                last_name='Nguyễn',
                address='371 Nguyễn Kiệm, Gò Vấp',
            )
        if created:
            chef.set_password('chef123456')
            chef.save()
            self.stdout.write(self.style.SUCCESS('Created chef: chef_minh'))

        # Categories
        cat_names = ['Khai vị', 'Món chính', 'Món nước', 'Tráng miệng', 'Đồ uống']
        cats = {}
        for name in cat_names:
            obj, _ = FoodCategory.objects.get_or_create(name=name)
            cats[name] = obj

        # Menus
        menu_main, _ = Menu.objects.get_or_create(
            name='Thực đơn chính',
            defaults={'description': 'Các món ăn chính của nhà hàng'},
        )
        menu_drink, _ = Menu.objects.get_or_create(
            name='Đồ uống & Tráng miệng',
            defaults={'description': 'Nước uống và món tráng miệng'},
        )

        # Dishes
        dishes_data = [
            {
                'name': 'Phở Bò Sài Gòn',
                'description': 'Phở bò truyền thống với nước dùng hầm xương 12 giờ, bánh phở tươi, thịt bò tái chín mềm.',
                'price': 65000,
                'ingredients': 'Bánh phở, bò tái, bò chín, hành lá, ngò gai, húng quế, giá đỗ',
                'preparation_time': 15,
                'menu': menu_main,
                'category': cats['Món nước'],
            },
            {
                'name': 'Cơm Tấm Sườn Bì Chả',
                'description': 'Cơm tấm đặc biệt với sườn nướng than hoa, bì heo, chả trứng, mỡ hành và nước mắm pha.',
                'price': 55000,
                'ingredients': 'Cơm tấm, sườn heo, bì, trứng, mỡ hành, đồ chua, nước mắm',
                'preparation_time': 20,
                'menu': menu_main,
                'category': cats['Món chính'],
            },
            {
                'name': 'Bún Chả Hà Nội',
                'description': 'Bún chả kiểu Hà Nội với chả miếng nướng và chả viên, nước chấm chua ngọt đặc trưng.',
                'price': 55000,
                'ingredients': 'Bún, thịt heo nướng, chả viên, rau sống, nước chấm',
                'preparation_time': 18,
                'menu': menu_main,
                'category': cats['Món chính'],
            },
            {
                'name': 'Gỏi Cuốn Tôm Thịt',
                'description': 'Gỏi cuốn tươi với tôm, thịt heo luộc, bún, rau sống cuốn bánh tráng, chấm tương đậu phộng.',
                'price': 40000,
                'ingredients': 'Bánh tráng, tôm, thịt heo, bún, xà lách, rau thơm, tương đậu phộng',
                'preparation_time': 10,
                'menu': menu_main,
                'category': cats['Khai vị'],
            },
            {
                'name': 'Bánh Xèo Miền Nam',
                'description': 'Bánh xèo giòn rụm nhân tôm, thịt, giá đỗ. Ăn kèm rau sống và nước mắm chua ngọt.',
                'price': 50000,
                'ingredients': 'Bột gạo, tôm, thịt heo, giá đỗ, hành lá, rau sống',
                'preparation_time': 15,
                'menu': menu_main,
                'category': cats['Món chính'],
            },
            {
                'name': 'Bò Lúc Lắc',
                'description': 'Thịt bò Úc xào với tỏi, hành tây, ớt chuông trên lửa lớn. Ăn kèm cơm trắng hoặc bánh mì.',
                'price': 85000,
                'ingredients': 'Thịt bò, tỏi, hành tây, ớt chuông, nước tương, tiêu',
                'preparation_time': 12,
                'menu': menu_main,
                'category': cats['Món chính'],
            },
            {
                'name': 'Canh Chua Cá Lóc',
                'description': 'Canh chua miền Nam nấu với cá lóc tươi, me, thơm, cà chua, giá đỗ, rau ngổ ôm.',
                'price': 60000,
                'ingredients': 'Cá lóc, me, thơm, cà chua, giá đỗ, bạc hà, ngổ ôm',
                'preparation_time': 25,
                'menu': menu_main,
                'category': cats['Món nước'],
            },
            {
                'name': 'Chè Ba Màu',
                'description': 'Chè ba màu truyền thống với đậu đỏ, đậu xanh, rau câu, nước cốt dừa và đá bào.',
                'price': 25000,
                'ingredients': 'Đậu đỏ, đậu xanh, rau câu, nước cốt dừa, đường',
                'preparation_time': 5,
                'menu': menu_drink,
                'category': cats['Tráng miệng'],
            },
            {
                'name': 'Cà Phê Sữa Đá',
                'description': 'Cà phê phin truyền thống pha với sữa đặc, đá viên. Đậm đà và thơm nồng.',
                'price': 29000,
                'ingredients': 'Cà phê rang xay, sữa đặc, đá',
                'preparation_time': 5,
                'menu': menu_drink,
                'category': cats['Đồ uống'],
            },
            {
                'name': 'Nước Chanh Muối',
                'description': 'Chanh muối ngâm lâu, pha với đường và đá. Giải nhiệt tốt cho ngày nóng Sài Gòn.',
                'price': 22000,
                'ingredients': 'Chanh muối, đường, đá, nước lọc',
                'preparation_time': 3,
                'menu': menu_drink,
                'category': cats['Đồ uống'],
            },
        ]

        count = 0
        for data in dishes_data:
            _, created = Dish.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'chef': chef},
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Seed done: {count} new dishes, {len(cats)} categories, 2 menus'))
