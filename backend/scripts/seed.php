<?php
/**
 * Database Seeder Script
 * Inserts initial data for testing and production setup.
 */

class Seeder {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        echo "🌱 Seeding initial data...\n";

        try {
            $this->seedAdmins();
            $this->seedCrew();
            // $this->seedRoutes(); // Can add later
            echo "✅ Seeding completed successfully!\n";
        } catch (PDOException $e) {
            echo "❌ Seeding failed: " . $e->getMessage() . "\n";
        }
    }

    private function seedAdmins() {
        echo "   - Seeding Admins...\n";
        $sql = "INSERT INTO admins (email, password, full_name, is_super_admin) VALUES (:email, :password, :full_name, :is_super_admin)
                ON DUPLICATE KEY UPDATE password = :password_update";
        
        $stmt = $this->pdo->prepare($sql);
        $passwordHash = password_hash('password', PASSWORD_DEFAULT);
        
        // Default Admin as per README
        $stmt->execute([
            ':email' => 'admin@kango.com',
            ':password' => $passwordHash,
            ':full_name' => 'System Administrator',
            ':is_super_admin' => 1,
            ':password_update' => $passwordHash
        ]);
    }

    private function seedCrew() {
        echo "   - Seeding Crew...\n";
        $sql = "INSERT INTO crew (full_name, email, password, nic, is_active, is_verified) VALUES (:full_name, :email, :password, :nic, :is_active, :is_verified)
                ON DUPLICATE KEY UPDATE password = :password_update";
        
        $stmt = $this->pdo->prepare($sql);
        $passwordHash = password_hash('password', PASSWORD_DEFAULT);
        
        // Default Crew as per README
        $stmt->execute([
            ':full_name' => 'John Smith',
            ':email' => 'john.smith@kango.com',
            ':password' => $passwordHash,
            ':nic' => '123456789V',
            ':is_active' => 1,
            ':is_verified' => 1,
            ':password_update' => $passwordHash
        ]);
    }
}
