const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbDir = path.dirname(process.env.DB_PATH || './database/healthcare.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(process.env.DB_PATH || './database/healthcare.db');

async function initializeDatabase() {
    console.log('🏥 Initializing Healthcare Appointment System Database...');

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');

    // Users table (for authentication)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Doctors table
    db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            license_number TEXT UNIQUE NOT NULL,
            specialization TEXT NOT NULL,
            qualification TEXT,
            experience_years INTEGER,
            consultation_fee DECIMAL(10,2),
            bio TEXT,
            profile_image TEXT,
            working_hours_start TIME DEFAULT '09:00',
            working_hours_end TIME DEFAULT '17:00',
            working_days TEXT DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
            is_available BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Patients table
    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            date_of_birth DATE,
            gender TEXT CHECK(gender IN ('male', 'female', 'other')),
            blood_group TEXT,
            address TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            medical_history TEXT,
            allergies TEXT,
            current_medications TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Appointments table
    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            duration_minutes INTEGER DEFAULT 30,
            type TEXT DEFAULT 'consultation' CHECK(type IN ('consultation', 'follow-up', 'emergency', 'telemedicine')),
            status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
            reason TEXT,
            notes TEXT,
            prescription TEXT,
            diagnosis TEXT,
            fee_amount DECIMAL(10,2),
            payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            UNIQUE(doctor_id, appointment_date, appointment_time)
        )
    `);

    // Medical records table
    db.run(`
        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_id INTEGER,
            record_date DATE DEFAULT (date('now')),
            symptoms TEXT,
            diagnosis TEXT,
            treatment TEXT,
            prescription TEXT,
            lab_results TEXT,
            notes TEXT,
            attachments TEXT, -- JSON array of file paths
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
        )
    `);

    // Email notifications log
    db.run(`
        CREATE TABLE IF NOT EXISTS email_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'welcome', 'password_reset')),
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
            appointment_id INTEGER,
            sent_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
        )
    `);

    // Availability slots table for doctors
    db.run(`
        CREATE TABLE IF NOT EXISTS doctor_availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER NOT NULL,
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            UNIQUE(doctor_id, date, start_time)
        )
    `);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);');
    db.run('CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    db.run('CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);');

    // Insert default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    db.run(`
        INSERT OR IGNORE INTO users (email, password, role, first_name, last_name)
        VALUES ('admin@healthcare.com', ?, 'admin', 'System', 'Administrator')
    `, [adminPassword]);

    // Insert sample doctors
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    
    db.serialize(() => {
        // Dr. Sarah Johnson - Cardiologist
        db.run(`
            INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, phone)
            VALUES ('dr.sarah@healthcare.com', ?, 'doctor', 'Sarah', 'Johnson', '+1-555-0101')
        `, [doctorPassword], function() {
            if (this.lastID) {
                db.run(`
                    INSERT OR IGNORE INTO doctors (user_id, license_number, specialization, qualification, experience_years, consultation_fee, bio)
                    VALUES (?, 'MD001', 'Cardiology', 'MD, FACC', 15, 150.00, 'Experienced cardiologist specializing in heart disease prevention and treatment.')
                `, [this.lastID]);
            }
        });

        // Dr. Michael Chen - Pediatrician
        db.run(`
            INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, phone)
            VALUES ('dr.michael@healthcare.com', ?, 'doctor', 'Michael', 'Chen', '+1-555-0102')
        `, [doctorPassword], function() {
            if (this.lastID) {
                db.run(`
                    INSERT OR IGNORE INTO doctors (user_id, license_number, specialization, qualification, experience_years, consultation_fee, bio)
                    VALUES (?, 'MD002', 'Pediatrics', 'MD, FAAP', 12, 120.00, 'Pediatrician dedicated to providing comprehensive care for children and adolescents.')
                `, [this.lastID]);
            }
        });

        // Dr. Emily Rodriguez - Dermatologist
        db.run(`
            INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, phone)
            VALUES ('dr.emily@healthcare.com', ?, 'doctor', 'Emily', 'Rodriguez', '+1-555-0103')
        `, [doctorPassword], function() {
            if (this.lastID) {
                db.run(`
                    INSERT OR IGNORE INTO doctors (user_id, license_number, specialization, qualification, experience_years, consultation_fee, bio)
                    VALUES (?, 'MD003', 'Dermatology', 'MD, FAAD', 8, 130.00, 'Dermatologist specializing in skin care, cosmetic procedures, and skin cancer prevention.')
                `, [this.lastID]);
            }
        });
    });

    // Insert sample patient
    const patientPassword = await bcrypt.hash('patient123', 10);
    db.run(`
        INSERT OR IGNORE INTO users (email, password, role, first_name, last_name, phone)
        VALUES ('patient@demo.com', ?, 'patient', 'John', 'Doe', '+1-555-0201')
    `, [patientPassword], function() {
        if (this.lastID) {
            db.run(`
                INSERT OR IGNORE INTO patients (user_id, date_of_birth, gender, blood_group, address)
                VALUES (?, '1990-05-15', 'male', 'O+', '123 Main St, Anytown, USA')
            `, [this.lastID]);
        }
    });

    console.log('✅ Database initialized successfully!');
    console.log('🔑 Default Accounts:');
    console.log('   Admin: admin@healthcare.com / admin123');
    console.log('   Doctors: dr.sarah@healthcare.com / doctor123');
    console.log('           dr.michael@healthcare.com / doctor123');
    console.log('           dr.emily@healthcare.com / doctor123');
    console.log('   Patient: patient@demo.com / patient123');
}

db.serialize(async () => {
    await initializeDatabase();
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('📦 Database connection closed.');
        }
        process.exit(0);
    });
});