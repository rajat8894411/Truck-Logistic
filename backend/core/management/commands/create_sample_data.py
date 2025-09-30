from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import User, Truck, Requirement
import random


class Command(BaseCommand):
    help = 'Create sample data for testing the trucking logistics system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=5,
            help='Number of truck owner users to create',
        )
        parser.add_argument(
            '--admins',
            type=int,
            default=2,
            help='Number of admin users to create',
        )
        parser.add_argument(
            '--requirements',
            type=int,
            default=10,
            help='Number of requirements to create',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create admin users
        admins = []
        for i in range(options['admins']):
            admin = User.objects.create_user(
                username=f'admin{i+1}',
                email=f'admin{i+1}@example.com',
                password='admin123',
                first_name=f'Admin',
                last_name=f'User{i+1}',
                role='admin',
                phone_number=f'+1234567890{i}',
                address=f'Admin Address {i+1}'
            )
            admins.append(admin)
            self.stdout.write(f'Created admin: {admin.username}')
        
        # Create truck owner users
        truck_owners = []
        for i in range(options['users']):
            user = User.objects.create_user(
                username=f'truck_owner{i+1}',
                email=f'owner{i+1}@example.com',
                password='user123',
                first_name=f'Owner',
                last_name=f'User{i+1}',
                role='user',
                phone_number=f'+1987654321{i}',
                address=f'Truck Owner Address {i+1}'
            )
            truck_owners.append(user)
            self.stdout.write(f'Created truck owner: {user.username}')
            
            # Create 1-3 trucks for each owner
            truck_types = ['mini', 'small', 'medium', 'large', 'trailer']
            make_models = [
                'Tata 407', 'Mahindra Bolero', 'Ashok Leyland', 
                'Eicher Pro', 'Bharat Benz', 'Volvo'
            ]
            
            for j in range(random.randint(1, 3)):
                truck = Truck.objects.create(
                    user=user,
                    truck_type=random.choice(truck_types),
                    capacity=random.uniform(1.0, 25.0),
                    registration_number=f'TN{i+1:02d}AB{j+1:04d}',
                    make_model=random.choice(make_models),
                    year=random.randint(2015, 2023),
                    current_location=f'Location {i+1}-{j+1}'
                )
                self.stdout.write(f'  Created truck: {truck.registration_number}')
        
        # Create requirements
        load_types = ['electronics', 'furniture', 'food_items', 'construction', 
                     'automotive', 'textiles', 'chemicals', 'machinery']
        truck_types = ['mini', 'small', 'medium', 'large', 'trailer']
        
        cities = [
            'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
            'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
            'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'
        ]
        
        for i in range(options['requirements']):
            admin = random.choice(admins)
            from_city = random.choice(cities)
            to_city = random.choice([city for city in cities if city != from_city])
            
            pickup_date = timezone.now() + timedelta(days=random.randint(1, 30))
            delivery_date = pickup_date + timedelta(days=random.randint(1, 7))
            bidding_end = pickup_date - timedelta(days=random.randint(1, 5))
            
            requirement = Requirement.objects.create(
                admin=admin,
                title=f'Transport {random.choice(load_types).title()} from {from_city} to {to_city}',
                description=f'Need to transport goods from {from_city} to {to_city}. Urgent delivery required.',
                load_type=random.choice(load_types),
                weight=random.uniform(0.5, 20.0),
                truck_type=random.choice(truck_types),
                from_location=f'{from_city}, India',
                to_location=f'{to_city}, India',
                pickup_date=pickup_date,
                delivery_date=delivery_date,
                budget_min=random.uniform(5000, 25000),
                budget_max=random.uniform(25000, 50000),
                bidding_end_date=bidding_end,
                special_instructions='Handle with care. Contact before pickup.'
            )
            self.stdout.write(f'Created requirement: {requirement.title}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(admins)} admins, '
                f'{len(truck_owners)} truck owners, and {options["requirements"]} requirements'
            )
        )
        
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('Admin users: admin1, admin2, ... (password: admin123)')
        self.stdout.write('Truck owners: truck_owner1, truck_owner2, ... (password: user123)')
