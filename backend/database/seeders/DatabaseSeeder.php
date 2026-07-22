<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\ProfilePhoto;
use App\Models\Restaurant;
use App\Models\Message;
use App\Models\UserMatch;
use App\Models\Swipe;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ──────────────────────────────────────────────────────
        // 1. PRIMARY DEMO MALE USER (Alex Morgan — logs in with alex@heartlink.com)
        // ──────────────────────────────────────────────────────
        $alex = User::firstOrCreate(
            ['email' => 'alex@heartlink.com'],
            [
                'name'                => 'Alex Morgan',
                'password'            => Hash::make('password123'),
                'age'                 => 26,
                'gender'              => 'Male',
                'bio'                 => 'Architectural designer, coffee enthusiast, and weekend photographer. Always looking for the next great adventure.',
                'job'                 => 'Senior Architect',
                'avatar'              => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'country'             => 'USA',
                'relationship_type'   => 'Long-term relationship',
                'compatibility_score' => 96,
                'interests'           => json_encode(['Architecture', 'Coffee', 'Design', 'Photography', 'Travel']),
            ]
        );

        $this->addPhotos($alex->id, [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        ]);

        // ──────────────────────────────────────────────────────
        // 1B. USER ACCOUNT: Prathamesh (prathamesh@gmail.com / 111111)
        // ──────────────────────────────────────────────────────
        $prathamesh = User::firstOrCreate(
            ['email' => 'prathamesh@gmail.com'],
            [
                'name'                => 'Prathamesh',
                'password'            => Hash::make('111111'),
                'age'                 => 25,
                'gender'              => 'Male',
                'bio'                 => 'Passionate tech enthusiast, coffee lover, and explorer looking for meaningful connections.',
                'job'                 => 'Software Engineer',
                'avatar'              => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
                'city'                => 'Mumbai',
                'state'               => 'MH',
                'country'             => 'India',
                'relationship_type'   => 'Long-term relationship',
                'compatibility_score' => 98,
                'interests'           => json_encode(['Coding', 'Travel', 'Music', 'Fitness', 'Coffee']),
            ]
        );

        $this->addPhotos($prathamesh->id, [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
        ]);

        // ──────────────────────────────────────────────────────
        // 2. PRIMARY DEMO FEMALE USER (Anjali — logs in with anjali@heartlink.com)
        //    Will see Male profiles on Discover
        // ──────────────────────────────────────────────────────
        $anjali = User::firstOrCreate(
            ['email' => 'anjali@heartlink.com'],
            [
                'name'                => 'Anjali Sharma',
                'password'            => Hash::make('password123'),
                'age'                 => 23,
                'gender'              => 'Female',
                'bio'                 => 'Passionate about literature, yoga, and exploring street food. Looking for someone who matches my vibe.',
                'job'                 => 'Content Creator',
                'avatar'              => 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500',
                'city'                => 'Mumbai',
                'state'               => 'MH',
                'country'             => 'India',
                'relationship_type'   => 'Long-term relationship',
                'compatibility_score' => 93,
                'interests'           => json_encode(['Literature', 'Yoga', 'Street Food', 'Travel', 'Music']),
            ]
        );

        $this->addPhotos($anjali->id, [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
        ]);

        // ──────────────────────────────────────────────────────
        // 2B. USER ACCOUNT: Anjali (anjali@gmail.com / 111111)
        // ──────────────────────────────────────────────────────
        $anjaliG = User::firstOrCreate(
            ['email' => 'anjali@gmail.com'],
            [
                'name'                => 'Anjali',
                'password'            => Hash::make('111111'),
                'age'                 => 24,
                'gender'              => 'Female',
                'bio'                 => 'Passionate about literature, art, and exploring street food. Looking for someone who matches my vibe.',
                'job'                 => 'Creative Designer',
                'avatar'              => 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500',
                'city'                => 'Mumbai',
                'state'               => 'MH',
                'country'             => 'India',
                'relationship_type'   => 'Long-term relationship',
                'compatibility_score' => 95,
                'interests'           => json_encode(['Literature', 'Art', 'Design', 'Travel', 'Music']),
            ]
        );

        $this->addPhotos($anjaliG->id, [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
        ]);

        // ──────────────────────────────────────────────────────
        // 3. FEMALE PROFILES (shown to Alex & other Male users on Discover)
        // ──────────────────────────────────────────────────────
        $femaleProfiles = [
            [
                'name'                => 'Sophia Carter',
                'email'               => 'sophia@example.com',
                'age'                 => 24,
                'gender'              => 'Female',
                'job'                 => 'Creative Director',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 94,
                'bio'                 => 'Living colorfully, one outfit at a time. Always chasing the next adventure, trying new coffee shops, and painting on weekends!',
                'interests'           => ['Design', 'Art', 'Coffee', 'Photography', 'Yoga'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
                ],
            ],
            [
                'name'                => 'Mia Rodriguez',
                'email'               => 'mia@example.com',
                'age'                 => 25,
                'gender'              => 'Female',
                'job'                 => 'UX Researcher',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 91,
                'bio'                 => 'Exploring coffee shops, reading sci-fi, and finding the best rooftop sunsets in the city. Let us grab matcha!',
                'interests'           => ['UX', 'Sci-Fi', 'Coffee', 'Reading', 'Sunsets'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
                ],
            ],
            [
                'name'                => 'Zoe Martin',
                'email'               => 'zoe@example.com',
                'age'                 => 23,
                'gender'              => 'Female',
                'job'                 => 'Fashion Stylist',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 89,
                'bio'                 => 'Vibe enthusiast. Vintage clothes collector, vinyl spinner, and passionate foodie.',
                'interests'           => ['Fashion', 'Vintage', 'Vinyl', 'Foodie', 'Art'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800',
                    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
                ],
            ],
            [
                'name'                => 'Lily Chen',
                'email'               => 'lily@example.com',
                'age'                 => 26,
                'gender'              => 'Female',
                'job'                 => 'Graphic Designer',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 88,
                'bio'                 => 'Typography nerd and matcha lover. Minimalist design, vinyl records, and weekend city exploration are my things.',
                'interests'           => ['Design', 'Typography', 'Matcha', 'Vinyl', 'Cities'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=800',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
                ],
            ],
            [
                'name'                => 'Aria Sterling',
                'email'               => 'aria@example.com',
                'age'                 => 22,
                'gender'              => 'Female',
                'job'                 => 'Marketing Manager',
                'city'                => 'Evanston',
                'state'               => 'IL',
                'compatibility_score' => 92,
                'bio'                 => 'Brand storyteller by day, amateur chef by night. Passionate about sustainable travel and slow mornings.',
                'interests'           => ['Marketing', 'Cooking', 'Travel', 'Sustainability', 'Yoga'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
                ],
            ],
            [
                'name'                => 'Samirokta Rachin',
                'email'               => 'samirokta@example.com',
                'age'                 => 25,
                'gender'              => 'Female',
                'job'                 => 'Fashion Model',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 95,
                'bio'                 => 'Living colorfully, one outfit at a time. Style is a way to say who you are without speaking. Always chasing the next adventure!',
                'interests'           => ['Fashion', 'Travel', 'Photography', 'Coffee', 'Yoga'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
                    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
                ],
            ],
            [
                'name'                => 'Isabella Ross',
                'email'               => 'isabella@example.com',
                'age'                 => 24,
                'gender'              => 'Female',
                'job'                 => 'Interior Designer',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 90,
                'bio'                 => 'Creating cozy aesthetic spaces. Lover of houseplants, architectural tours, and artisan bakeries.',
                'interests'           => ['Interior', 'Design', 'Architecture', 'Bakeries', 'Plants'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
                ],
            ],
            [
                'name'                => 'Chloe Bennett',
                'email'               => 'chloe@example.com',
                'age'                 => 23,
                'gender'              => 'Female',
                'job'                 => 'Event Strategist',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 93,
                'bio'                 => 'Festival goer, live music enthusiast, and lover of warm sunsets and beach volleyball.',
                'interests'           => ['Concerts', 'Volleyball', 'Sunsets', 'Music', 'Festivals'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
                ],
            ],
            [
                'name'                => 'Emma Watson',
                'email'               => 'emma@example.com',
                'age'                 => 25,
                'gender'              => 'Female',
                'job'                 => 'Environmental Scientist',
                'city'                => 'Chicago',
                'state'               => 'IL',
                'compatibility_score' => 96,
                'bio'                 => 'Exploring nature trails, reading classic novels, and sipping chai on rainy afternoons.',
                'interests'           => ['Nature', 'Books', 'Chai', 'Hiking', 'Science'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
                    'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=800',
                ],
            ],
        ];

        $femaleUsers = [];
        foreach ($femaleProfiles as $pData) {
            $photos = $pData['photos'];
            unset($pData['photos']);

            $user = User::firstOrCreate(
                ['email' => $pData['email']],
                array_merge($pData, [
                    'password'  => Hash::make('password123'),
                    'avatar'    => $photos[0],
                    'country'   => 'USA',
                    'relationship_type' => 'Long-term relationship',
                    'interests' => json_encode($pData['interests']),
                ])
            );
            $this->addPhotos($user->id, $photos);
            $femaleUsers[] = $user;
        }

        // ──────────────────────────────────────────────────────
        // 4. MALE PROFILES (shown to Anjali & other Female users on Discover)
        // ──────────────────────────────────────────────────────
        $maleProfiles = [
            [
                'name'                => 'Rahul Verma',
                'email'               => 'rahul@example.com',
                'age'                 => 27,
                'gender'              => 'Male',
                'job'                 => 'Software Engineer',
                'city'                => 'Mumbai',
                'state'               => 'MH',
                'compatibility_score' => 91,
                'bio'                 => 'Building the future one line of code at a time. Rock climber on weekends, jazz enthusiast every evening.',
                'interests'           => ['Tech', 'Rock Climbing', 'Jazz', 'Cooking', 'Books'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
                ],
            ],
            [
                'name'                => 'James Whitfield',
                'email'               => 'james@example.com',
                'age'                 => 28,
                'gender'              => 'Male',
                'job'                 => 'Product Manager',
                'city'                => 'Mumbai',
                'state'               => 'MH',
                'compatibility_score' => 88,
                'bio'                 => 'Turning ideas into products people love. Hiking trails and hidden speakeasies are my weekend essentials.',
                'interests'           => ['Product', 'Hiking', 'Mixology', 'Strategy', 'Music'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
                    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800',
                ],
            ],
            [
                'name'                => 'Arjun Kapoor',
                'email'               => 'arjun@example.com',
                'age'                 => 25,
                'gender'              => 'Male',
                'job'                 => 'Photographer',
                'city'                => 'Pune',
                'state'               => 'MH',
                'compatibility_score' => 95,
                'bio'                 => 'Capturing the world through my lens. Street photography, golden hour, and chai conversations are life.',
                'interests'           => ['Photography', 'Travel', 'Street Art', 'Chai', 'Cinema'],
                'photos'              => [
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800',
                    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
                ],
            ],
        ];

        $maleUsers = [];
        foreach ($maleProfiles as $pData) {
            $photos = $pData['photos'];
            unset($pData['photos']);

            $user = User::firstOrCreate(
                ['email' => $pData['email']],
                array_merge($pData, [
                    'password'          => Hash::make('password123'),
                    'avatar'            => $photos[0],
                    'country'           => 'India',
                    'relationship_type' => 'Long-term relationship',
                    'interests'         => json_encode($pData['interests']),
                ])
            );
            $this->addPhotos($user->id, $photos);
            $maleUsers[] = $user;
        }

        // ──────────────────────────────────────────────────────
        // 5. SWIPES → Requests Screen
        //    Rahul & James liked Anjali  → shows on Anjali's Requests tab
        //    Sophia liked Alex           → shows on Alex's Requests tab
        //    Mia liked Alex              → shows on Alex's Requests tab
        // ──────────────────────────────────────────────────────
        $this->swipe($maleUsers[0]->id, $anjali->id, 'like'); // Rahul → Anjali
        $this->swipe($maleUsers[1]->id, $anjali->id, 'like'); // James → Anjali
        $this->swipe($femaleUsers[0]->id, $alex->id, 'like'); // Sophia → Alex
        $this->swipe($femaleUsers[1]->id, $alex->id, 'like'); // Mia → Alex

        // ──────────────────────────────────────────────────────
        // 6. MUTUAL MATCHES + MESSAGES → Matches & Chat screens
        //    Alex ↔ Sophia (matched + conversation)
        //    Anjali ↔ Arjun (matched + conversation)
        // ──────────────────────────────────────────────────────
        $sophia = $femaleUsers[0];
        $arjun  = $maleUsers[2];

        // Alex ↔ Sophia match
        $this->swipe($alex->id, $sophia->id, 'like');
        $this->swipe($sophia->id, $alex->id, 'like');
        $this->createMatch($alex->id, $sophia->id);

        Message::create(['sender_id' => $sophia->id, 'receiver_id' => $alex->id, 'message' => "Hey Alex! I love your architecture portfolio.", 'is_read' => true]);
        Message::create(['sender_id' => $alex->id,   'receiver_id' => $sophia->id, 'message' => "Thanks Sophia! Your creative work is stunning too.", 'is_read' => true]);
        Message::create(['sender_id' => $sophia->id, 'receiver_id' => $alex->id, 'message' => "We should grab coffee and talk design sometime!", 'is_read' => true]);
        Message::create(['sender_id' => $alex->id,   'receiver_id' => $sophia->id, 'message' => "Absolutely! This weekend works for me. You?", 'is_read' => false]);

        // Anjali ↔ Arjun match
        $this->swipe($anjali->id, $arjun->id, 'like');
        $this->swipe($arjun->id, $anjali->id, 'like');
        $this->createMatch($anjali->id, $arjun->id);

        Message::create(['sender_id' => $arjun->id,  'receiver_id' => $anjali->id, 'message' => "Hi Anjali! Loved your profile. Your taste in music is amazing.", 'is_read' => true]);
        Message::create(['sender_id' => $anjali->id, 'receiver_id' => $arjun->id,  'message' => "Haha thank you! Your photography is incredible. The golden hour shots especially!", 'is_read' => true]);
        Message::create(['sender_id' => $arjun->id,  'receiver_id' => $anjali->id, 'message' => "Would love to show you some locations sometime. Know any good chai spots?", 'is_read' => false]);

        // Alex ↔ Zoe match (no messages yet — shows in matches but empty chat)
        $zoe = $femaleUsers[2];
        $this->swipe($alex->id, $zoe->id, 'like');
        $this->swipe($zoe->id, $alex->id, 'like');
        $this->createMatch($alex->id, $zoe->id);

        // ──────────────────────────────────────────────────────
        // 7. DATE RESTAURANTS → Date Planner screen
        // ──────────────────────────────────────────────────────
        $restaurants = [
            [
                'name'        => 'LUMA Rooftop Lounge',
                'category'    => 'Cocktail Bar & Tapas',
                'rating'      => 4.9,
                'location'    => 'Downtown Waterfront',
                'image'       => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                'description' => 'Panoramic skyline views, crafted botanical cocktails, and live jazz vibes under starry skies. Perfect for a first date or anniversary.',
                'price_range' => '$$$',
                'map_url'     => 'https://maps.google.com/?q=LUMA+Rooftop+Chicago',
                'is_boosted'  => true,
            ],
            [
                'name'        => 'Aura Garden Bistro',
                'category'    => 'Organic Italian',
                'rating'      => 4.8,
                'location'    => 'West Loop Arts District',
                'image'       => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
                'description' => 'Enchanted courtyard dining with glowing fairy lights, handmade pasta, and organic wine pairings.',
                'price_range' => '$$',
                'map_url'     => 'https://maps.google.com/?q=Aura+Garden+Bistro',
            ],
            [
                'name'        => 'Velvet & Smoke',
                'category'    => 'Speakeasy & Steakhouse',
                'rating'      => 4.7,
                'location'    => 'Old Town Historic',
                'image'       => 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800',
                'description' => 'Hidden entrance behind a bookshelf. Dim plush leather booths and artisan smoked bourbon cocktails.',
                'price_range' => '$$$$',
                'map_url'     => 'https://maps.google.com/?q=Velvet+Smoke+Chicago',
            ],
            [
                'name'        => 'La Maison du Soir',
                'category'    => 'French Fine Dining',
                'rating'      => 4.9,
                'location'    => 'Gold Coast',
                'image'       => 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
                'description' => 'Classic French haute cuisine in an intimate setting with candle-lit tables and a sommelier on staff.',
                'price_range' => '$$$$',
                'map_url'     => 'https://maps.google.com/?q=La+Maison+du+Soir+Chicago',
            ],
            [
                'name'        => 'Sakura Omakase Bar',
                'category'    => 'Japanese Omakase',
                'rating'      => 5.0,
                'location'    => 'River North',
                'image'       => 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
                'description' => 'Chef-curated 12-course sushi experience with seasonal imports from Tsukiji. Intimate counter seating for two.',
                'price_range' => '$$$$',
                'map_url'     => 'https://maps.google.com/?q=Sakura+Omakase+Chicago',
            ],
            [
                'name'        => 'The Lantern Terrace',
                'category'    => 'Mediterranean Rooftop',
                'rating'      => 4.6,
                'location'    => 'Lincoln Park',
                'image'       => 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
                'description' => 'Open-air Mediterranean mezze under hanging lanterns. Warm spices, chilled rose, and live oud music on Fridays.',
                'price_range' => '$$$',
                'map_url'     => 'https://maps.google.com/?q=The+Lantern+Terrace+Chicago',
            ],
        ];

        foreach ($restaurants as $r) {
            Restaurant::firstOrCreate(['name' => $r['name']], $r);
        }

        $this->command->info('HeartLink test data seeded successfully!');
        $this->command->info('Male login: alex@heartlink.com / password123');
        $this->command->info('Female login: anjali@heartlink.com / password123');
    }

    private function addPhotos(int $userId, array $photos): void
    {
        ProfilePhoto::where('user_id', $userId)->delete();
        foreach ($photos as $idx => $url) {
            ProfilePhoto::create([
                'user_id'    => $userId,
                'photo_url'  => $url,
                'is_primary' => $idx === 0,
                'sort_order' => $idx,
            ]);
        }
    }

    private function swipe(int $swiperId, int $swipedId, string $type): void
    {
        Swipe::firstOrCreate(
            ['swiper_id' => $swiperId, 'swiped_user_id' => $swipedId],
            ['type' => $type]
        );
    }

    private function createMatch(int $user1, int $user2): void
    {
        UserMatch::firstOrCreate([
            'user_1_id' => min($user1, $user2),
            'user_2_id' => max($user1, $user2),
        ], [
            'matched_at' => now(),
        ]);
    }
}
