<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('zodiac_sign')->nullable()->after('relationship_type');
            $table->enum('drinking', ['Never', 'Socially', 'Regularly', 'Prefer not to say'])->nullable()->after('zodiac_sign');
            $table->enum('smoking', ['Never', 'Occasionally', 'Regularly', 'Prefer not to say'])->nullable()->after('drinking');
            $table->enum('exercise', ['Never', 'Sometimes', 'Often', 'Daily'])->nullable()->after('smoking');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['zodiac_sign', 'drinking', 'smoking', 'exercise']);
        });
    }
};
