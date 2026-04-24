from django.core.management.base import BaseCommand
from restaurant.models import User, FoodCategory, Menu, Dish


class Command(BaseCommand):
    help = 'Seed sample data for restaurant app'

    def handle(self, *args, **options):
        # Chef
        chef, created = User.objects.get_or_create(
            username='chef_minh',
            defaults={
                'first_name': 'Minh',
                'last_name': 'Nguyen',
                'email': 'minh@saigonsavory.vn',
                'role': 'chef',
                'is_verified': True,
                'phone': '0901234567',
                'address': '371 Nguyen Kiem, Go Vap',
            },
        )
        if created:
            chef.set_password('chef123456')
            chef.save()
            self.stdout.write(self.style.SUCCESS('Created chef: chef_minh'))

        # Categories
        cat_names = ['Khai vi', 'Mon chinh', 'Mon nuoc', 'Trang mieng', 'Do uong']
        cats = {}
        for name in cat_names:
            obj, _ = FoodCategory.objects.get_or_create(name=name)
            cats[name] = obj

        # Menus
        menu_main, _ = Menu.objects.get_or_create(name='Thuc don chinh', defaults={'description': 'Cac mon an chinh cua nha hang'})
        menu_drink, _ = Menu.objects.get_or_create(name='Do uong & Trang mieng', defaults={'description': 'Nuoc uong va mon trang mieng'})

        # Dishes
        dishes_data = [
            {
                'name': 'Pho Bo Sai Gon',
                'description': 'Pho bo truyen thong voi nuoc dung ham xuong 12 gio, banh pho tuoi, thit bo tai chin mem.',
                'price': 65000,
                'ingredients': 'Banh pho, bo tai, bo chin, hanh la, ngo gai, hung que, gia do',
                'preparation_time': 15,
                'menu': menu_main,
                'category': cats['Mon nuoc'],
            },
            {
                'name': 'Com Tam Suon Bi Cha',
                'description': 'Com tam dat biet voi suon nuong than hoa, bi heo, cha trung, mo hanh va nuoc mam pha.',
                'price': 55000,
                'ingredients': 'Com tam, suon heo, bi, trung, mo hanh, do chua, nuoc mam',
                'preparation_time': 20,
                'menu': menu_main,
                'category': cats['Mon chinh'],
            },
            {
                'name': 'Bun Cha Ha Noi',
                'description': 'Bun cha kieu Ha Noi voi cha mieng nuong va cha vien, nuoc cham chua ngot dac trung.',
                'price': 55000,
                'ingredients': 'Bun, thit heo nuong, cha vien, rau song, nuoc cham',
                'preparation_time': 18,
                'menu': menu_main,
                'category': cats['Mon chinh'],
            },
            {
                'name': 'Goi Cuon Tom Thit',
                'description': 'Goi cuon tuoi voi tom, thit heo luoc, bun, rau song cuon banh trang, cham tuong dau phong.',
                'price': 40000,
                'ingredients': 'Banh trang, tom, thit heo, bun, xa lach, rau thom, tuong dau phong',
                'preparation_time': 10,
                'menu': menu_main,
                'category': cats['Khai vi'],
            },
            {
                'name': 'Banh Xeo Mien Nam',
                'description': 'Banh xeo gion rum nhan tom, thit, gia do. An kem rau song va nuoc mam chua ngot.',
                'price': 50000,
                'ingredients': 'Bot gao, tom, thit heo, gia do, hanh la, rau song',
                'preparation_time': 15,
                'menu': menu_main,
                'category': cats['Mon chinh'],
            },
            {
                'name': 'Bo Luc Lac',
                'description': 'Thit bo Uc xao voi toi, hanh tay, ot chuong tren lua lon. An kem com trang hoac banh mi.',
                'price': 85000,
                'ingredients': 'Thit bo, toi, hanh tay, ot chuong, nuoc tuong, tieu',
                'preparation_time': 12,
                'menu': menu_main,
                'category': cats['Mon chinh'],
            },
            {
                'name': 'Canh Chua Ca Loc',
                'description': 'Canh chua mien Nam nau voi ca loc tuoi, me, thom, ca chua, gia do, rau ngo om.',
                'price': 60000,
                'ingredients': 'Ca loc, me, thom, ca chua, gia do, bac ha, ngo om',
                'preparation_time': 25,
                'menu': menu_main,
                'category': cats['Mon nuoc'],
            },
            {
                'name': 'Che Ba Mau',
                'description': 'Che ba mau truyen thong voi dau do, dau xanh, rau cau, nuoc cot dua va da bao.',
                'price': 25000,
                'ingredients': 'Dau do, dau xanh, rau cau, nuoc cot dua, duong',
                'preparation_time': 5,
                'menu': menu_drink,
                'category': cats['Trang mieng'],
            },
            {
                'name': 'Ca Phe Sua Da',
                'description': 'Ca phe phin truyen thong pha voi sua dac, da vien. Dam da va thom nong.',
                'price': 29000,
                'ingredients': 'Ca phe rang xay, sua dac, da',
                'preparation_time': 5,
                'menu': menu_drink,
                'category': cats['Do uong'],
            },
            {
                'name': 'Nuoc Chanh Muoi',
                'description': 'Chanh muoi ngam lau, pha voi duong va da. Giai nhiet tot cho ngay nong Sai Gon.',
                'price': 22000,
                'ingredients': 'Chanh muoi, duong, da, nuoc loc',
                'preparation_time': 3,
                'menu': menu_drink,
                'category': cats['Do uong'],
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
