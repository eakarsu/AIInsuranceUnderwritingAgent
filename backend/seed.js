require('dotenv').config({ path: '../.env' });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_DEMO_SEED !== 'true' || process.env.NODE_ENV === 'production') throw new Error('destructive demo seed is disabled');
  if (!process.env.DEMO_ADMIN_PASSWORD || !process.env.DEMO_UNDERWRITER_PASSWORD) throw new Error('explicit demo passwords are required for demo seeding');
  try {
    console.log('Starting database seed...\n');

    // ─── 1. USERS ───────────────────────────────────────────────
    console.log('Creating users table...');
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const adminHash = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10);
    const underwriterHash = await bcrypt.hash(process.env.DEMO_UNDERWRITER_PASSWORD, 10);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
        ('Admin User', 'admin@insuranceai.com', $1, 'admin'),
        ('Jane Underwriter', 'underwriter@insuranceai.com', $2, 'underwriter')
    `, [adminHash, underwriterHash]);
    console.log('  Seeded 2 users.');

    // ─── 2. POLICIES ────────────────────────────────────────────
    console.log('Creating policies table...');
    await pool.query(`DROP TABLE IF EXISTS policies CASCADE`);
    await pool.query(`
      CREATE TABLE policies (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        policy_type VARCHAR(100) NOT NULL,
        coverage_amount DECIMAL(15,2),
        premium DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        deductible DECIMAL(15,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO policies (policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description) VALUES
        ('POL-2024-0001', 'John Martinez', 'auto', 50000.00, 1200.00, 'active', '2024-01-15', '2025-01-15', 500.00, 'Comprehensive auto coverage for 2022 Toyota Camry'),
        ('POL-2024-0002', 'Sarah Chen', 'home', 450000.00, 2800.00, 'active', '2024-02-01', '2025-02-01', 1000.00, 'Homeowners policy covering dwelling, personal property, and liability'),
        ('POL-2024-0003', 'Robert Williams', 'life', 1000000.00, 3600.00, 'active', '2024-03-10', '2054-03-10', 0.00, '30-year term life insurance policy'),
        ('POL-2024-0004', 'Apex Manufacturing LLC', 'commercial', 5000000.00, 24000.00, 'active', '2024-01-01', '2025-01-01', 5000.00, 'Commercial general liability for manufacturing operations'),
        ('POL-2024-0005', 'Emily Johnson', 'health', 500000.00, 4800.00, 'active', '2024-04-01', '2025-04-01', 2000.00, 'PPO health insurance plan with dental and vision'),
        ('POL-2024-0006', 'David Park', 'auto', 75000.00, 1800.00, 'active', '2024-05-15', '2025-05-15', 750.00, 'Full coverage auto policy for 2023 BMW X5'),
        ('POL-2024-0007', 'Coastal Dining Group', 'commercial', 3000000.00, 15000.00, 'active', '2024-06-01', '2025-06-01', 2500.00, 'Restaurant liability and property coverage'),
        ('POL-2024-0008', 'Maria Gonzalez', 'home', 320000.00, 1950.00, 'pending', '2024-07-01', '2025-07-01', 1500.00, 'HO-3 special form homeowners policy'),
        ('POL-2024-0009', 'TechVenture Inc', 'commercial', 10000000.00, 42000.00, 'active', '2024-03-01', '2025-03-01', 10000.00, 'Technology E&O and cyber liability coverage'),
        ('POL-2024-0010', 'Lisa Thompson', 'life', 500000.00, 1800.00, 'active', '2024-08-15', '2049-08-15', 0.00, '25-year term life policy with accelerated death benefit'),
        ('POL-2024-0011', 'James O''Brien', 'auto', 35000.00, 950.00, 'expired', '2024-01-01', '2025-01-01', 500.00, 'Liability-only auto coverage for 2019 Honda Civic'),
        ('POL-2024-0012', 'Greenfield Farms Co', 'commercial', 2000000.00, 9500.00, 'active', '2024-09-01', '2025-09-01', 3000.00, 'Farm and ranch commercial package policy'),
        ('POL-2024-0013', 'Angela Davis', 'health', 750000.00, 6200.00, 'active', '2024-10-01', '2025-10-01', 1500.00, 'Family health plan with prescription drug coverage'),
        ('POL-2025-0014', 'Kevin Nguyen', 'home', 580000.00, 3400.00, 'active', '2025-01-01', '2026-01-01', 2000.00, 'High-value homeowners policy with scheduled personal property'),
        ('POL-2025-0015', 'Summit Logistics LLC', 'commercial', 8000000.00, 36000.00, 'active', '2025-02-01', '2026-02-01', 7500.00, 'Commercial auto fleet and cargo coverage for 45 vehicles')
    `);
    console.log('  Seeded 15 policies.');

    // ─── 3. CUSTOMERS ───────────────────────────────────────────
    console.log('Creating customers table...');
    await pool.query(`DROP TABLE IF EXISTS customers CASCADE`);
    await pool.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        date_of_birth DATE,
        risk_score INTEGER,
        customer_type VARCHAR(50) DEFAULT 'individual',
        company_name VARCHAR(255),
        annual_revenue DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO customers (name, email, phone, address, date_of_birth, risk_score, customer_type, company_name, annual_revenue, status) VALUES
        ('John Martinez', 'john.martinez@email.com', '555-0101', '742 Elm Street, Austin, TX 78701', '1985-06-15', 32, 'individual', NULL, NULL, 'active'),
        ('Sarah Chen', 'sarah.chen@email.com', '555-0102', '1890 Oak Avenue, San Francisco, CA 94102', '1978-11-22', 18, 'individual', NULL, NULL, 'active'),
        ('Robert Williams', 'robert.w@email.com', '555-0103', '456 Pine Road, Chicago, IL 60601', '1990-03-08', 25, 'individual', NULL, NULL, 'active'),
        ('Apex Manufacturing LLC', 'contact@apexmfg.com', '555-0104', '2200 Industrial Blvd, Detroit, MI 48201', NULL, 55, 'commercial', 'Apex Manufacturing LLC', 12000000.00, 'active'),
        ('Emily Johnson', 'emily.j@email.com', '555-0105', '321 Maple Lane, Denver, CO 80201', '1992-09-30', 12, 'individual', NULL, NULL, 'active'),
        ('David Park', 'david.park@email.com', '555-0106', '88 Willow Court, Seattle, WA 98101', '1988-01-17', 40, 'individual', NULL, NULL, 'active'),
        ('Coastal Dining Group', 'info@coastaldining.com', '555-0107', '500 Harbor Drive, Miami, FL 33101', NULL, 48, 'commercial', 'Coastal Dining Group', 5500000.00, 'active'),
        ('Maria Gonzalez', 'maria.g@email.com', '555-0108', '1122 Birch Street, Phoenix, AZ 85001', '1975-12-05', 22, 'individual', NULL, NULL, 'pending'),
        ('TechVenture Inc', 'admin@techventure.io', '555-0109', '1 Innovation Way, Palo Alto, CA 94301', NULL, 38, 'commercial', 'TechVenture Inc', 45000000.00, 'active'),
        ('Lisa Thompson', 'lisa.t@email.com', '555-0110', '678 Cedar Ave, Portland, OR 97201', '1983-07-20', 15, 'individual', NULL, NULL, 'active'),
        ('James O''Brien', 'james.ob@email.com', '555-0111', '234 Spruce Drive, Boston, MA 02101', '1995-04-12', 58, 'individual', NULL, NULL, 'active'),
        ('Greenfield Farms Co', 'office@greenfieldfarms.com', '555-0112', 'Route 9 Box 44, Topeka, KS 66601', NULL, 30, 'commercial', 'Greenfield Farms Co', 3200000.00, 'active'),
        ('Angela Davis', 'angela.d@email.com', '555-0113', '909 Aspen Way, Nashville, TN 37201', '1980-02-28', 20, 'individual', NULL, NULL, 'active'),
        ('Kevin Nguyen', 'kevin.n@email.com', '555-0114', '1455 Redwood Blvd, San Jose, CA 95101', '1991-10-09', 27, 'individual', NULL, NULL, 'active'),
        ('Summit Logistics LLC', 'dispatch@summitlogistics.com', '555-0115', '7800 Freight Parkway, Memphis, TN 38101', NULL, 62, 'commercial', 'Summit Logistics LLC', 28000000.00, 'active')
    `);
    console.log('  Seeded 15 customers.');

    // ─── 4. CLAIMS ──────────────────────────────────────────────
    console.log('Creating claims table...');
    await pool.query(`DROP TABLE IF EXISTS claims CASCADE`);
    await pool.query(`
      CREATE TABLE claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        policy_number VARCHAR(50) NOT NULL,
        claimant_name VARCHAR(255) NOT NULL,
        claim_type VARCHAR(100) NOT NULL,
        claim_amount DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'open',
        incident_date DATE,
        description TEXT,
        adjuster_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO claims (claim_number, policy_number, claimant_name, claim_type, claim_amount, status, incident_date, description, adjuster_notes) VALUES
        ('CLM-2024-0001', 'POL-2024-0001', 'John Martinez', 'collision', 8500.00, 'approved', '2024-03-22', 'Rear-end collision at intersection of 5th and Main. Other driver cited for failure to yield.', 'Police report obtained. Liability clear. Repair estimate from two shops consistent.'),
        ('CLM-2024-0002', 'POL-2024-0002', 'Sarah Chen', 'property_damage', 35000.00, 'under_review', '2024-06-15', 'Water damage from burst pipe in upstairs bathroom causing ceiling and floor damage to two rooms.', 'Plumber report confirms sudden pipe failure. Mold assessment pending.'),
        ('CLM-2024-0003', 'POL-2024-0004', 'Apex Manufacturing LLC', 'liability', 150000.00, 'open', '2024-04-10', 'Third-party injury claim from visitor who slipped on wet floor in warehouse area.', 'Incident report filed. Security footage under review. Claimant seeking medical expenses and lost wages.'),
        ('CLM-2024-0004', 'POL-2024-0005', 'Emily Johnson', 'medical', 12000.00, 'approved', '2024-05-03', 'Emergency appendectomy at St. Mary Hospital. Three-day inpatient stay.', 'All documentation verified. Within network coverage. Pre-authorization confirmed retroactively.'),
        ('CLM-2024-0005', 'POL-2024-0006', 'David Park', 'theft', 45000.00, 'under_review', '2024-07-20', 'Vehicle stolen from parking garage at 200 Commerce Street. Recovered with significant damage.', 'Police report #24-77892 filed. Vehicle recovered but deemed potential total loss. Awaiting final valuation.'),
        ('CLM-2024-0006', 'POL-2024-0007', 'Coastal Dining Group', 'property_damage', 28000.00, 'approved', '2024-08-12', 'Kitchen fire caused by grease trap malfunction. Fire suppression system activated limiting damage.', 'Fire marshal report confirms accidental cause. Restoration contractor engaged.'),
        ('CLM-2024-0007', 'POL-2024-0008', 'Maria Gonzalez', 'weather', 18500.00, 'open', '2024-09-05', 'Hail damage to roof and exterior siding from severe thunderstorm.', 'Adjuster inspection scheduled. Preliminary satellite weather data confirms severe hail event in area.'),
        ('CLM-2024-0008', 'POL-2024-0001', 'John Martinez', 'comprehensive', 3200.00, 'denied', '2024-10-18', 'Windshield replacement claim due to rock impact on highway.', 'Claim denied: deductible exceeds repair cost. Policyholder notified of glass coverage add-on option.'),
        ('CLM-2024-0009', 'POL-2024-0009', 'TechVenture Inc', 'cyber', 250000.00, 'open', '2024-11-02', 'Data breach affecting 15,000 customer records. Ransomware attack through phishing email.', 'Forensics team engaged. Breach notification process initiated. Legal counsel reviewing regulatory obligations.'),
        ('CLM-2024-0010', 'POL-2024-0012', 'Greenfield Farms Co', 'crop_damage', 85000.00, 'under_review', '2024-08-28', 'Drought conditions resulted in significant crop yield reduction for corn and soybean fields.', 'USDA drought declaration confirmed for county. Yield history being compared against actual production.'),
        ('CLM-2025-0011', 'POL-2024-0013', 'Angela Davis', 'medical', 7500.00, 'approved', '2025-01-10', 'Outpatient knee surgery at Vanderbilt Medical Center.', 'Pre-authorization on file. Surgery coding verified. Patient responsibility calculated.'),
        ('CLM-2025-0012', 'POL-2025-0014', 'Kevin Nguyen', 'property_damage', 22000.00, 'open', '2025-02-14', 'Tree fell on detached garage during winter storm causing structural damage.', 'Arborist report indicates healthy tree felled by exceptional wind. Structural engineer assessment needed.'),
        ('CLM-2025-0013', 'POL-2025-0015', 'Summit Logistics LLC', 'auto_fleet', 67000.00, 'under_review', '2025-01-25', 'Multi-vehicle accident involving two fleet trucks on I-40. Cargo damage included.', 'DOT report filed. Both drivers tested. Cargo manifest being reconciled with shipper claims.'),
        ('CLM-2025-0014', 'POL-2024-0002', 'Sarah Chen', 'liability', 55000.00, 'open', '2025-03-01', 'Guest injury on property - fell on icy walkway sustaining fractured wrist.', 'Medical records requested. Homeowner states salt was applied that morning. Witness statements pending.'),
        ('CLM-2025-0015', 'POL-2024-0006', 'David Park', 'collision', 12500.00, 'approved', '2025-02-20', 'Side-impact collision in parking lot. Other driver admitted fault at scene.', 'Dash cam footage confirms liability. Repair authorized at certified body shop.')
    `);
    console.log('  Seeded 15 claims.');

    // ─── 5. RISK ASSESSMENTS ────────────────────────────────────
    console.log('Creating risk_assessments table...');
    await pool.query(`DROP TABLE IF EXISTS risk_assessments CASCADE`);
    await pool.query(`
      CREATE TABLE risk_assessments (
        id SERIAL PRIMARY KEY,
        entity_name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        risk_category VARCHAR(100),
        risk_score INTEGER,
        risk_level VARCHAR(50),
        factors TEXT,
        location VARCHAR(255),
        industry VARCHAR(100),
        annual_revenue DECIMAL(15,2),
        employee_count INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO risk_assessments (entity_name, entity_type, risk_category, risk_score, risk_level, factors, location, industry, annual_revenue, employee_count, status) VALUES
        ('Apex Manufacturing LLC', 'commercial', 'operational', 72, 'high', 'Heavy machinery operation, chemical storage on-site, high employee turnover', 'Detroit, MI', 'Manufacturing', 12000000.00, 250, 'active'),
        ('John Martinez', 'individual', 'auto', 32, 'low', 'Clean driving record, low annual mileage, garaged vehicle', 'Austin, TX', NULL, NULL, NULL, 'active'),
        ('Coastal Dining Group', 'commercial', 'property', 58, 'medium', 'Commercial kitchen fire risk, high foot traffic, coastal flood zone', 'Miami, FL', 'Food Service', 5500000.00, 120, 'active'),
        ('TechVenture Inc', 'commercial', 'cyber', 65, 'high', 'Large customer database, cloud-based infrastructure, remote workforce', 'Palo Alto, CA', 'Technology', 45000000.00, 380, 'active'),
        ('Sarah Chen', 'individual', 'property', 18, 'low', 'Newer construction, security system, fire-resistant materials, no prior claims', 'San Francisco, CA', NULL, NULL, NULL, 'active'),
        ('Summit Logistics LLC', 'commercial', 'fleet', 78, 'high', 'Large vehicle fleet, long-haul routes, hazmat certified drivers required', 'Memphis, TN', 'Transportation', 28000000.00, 520, 'active'),
        ('David Park', 'individual', 'auto', 40, 'medium', 'One at-fault accident in past 3 years, high-value vehicle, urban parking', 'Seattle, WA', NULL, NULL, NULL, 'active'),
        ('Greenfield Farms Co', 'commercial', 'agricultural', 45, 'medium', 'Crop diversification, irrigation system, weather exposure, equipment value', 'Topeka, KS', 'Agriculture', 3200000.00, 45, 'active'),
        ('Emily Johnson', 'individual', 'health', 12, 'low', 'Non-smoker, regular exercise, no pre-existing conditions, age 32', 'Denver, CO', NULL, NULL, NULL, 'active'),
        ('James O''Brien', 'individual', 'auto', 58, 'medium', 'Two speeding violations, young driver, urban area, no garage', 'Boston, MA', NULL, NULL, NULL, 'active'),
        ('Pacific Rim Imports', 'commercial', 'marine_cargo', 68, 'high', 'International shipping routes, perishable goods, port congestion risk', 'Long Beach, CA', 'Import/Export', 18000000.00, 95, 'active'),
        ('Lisa Thompson', 'individual', 'life', 15, 'low', 'Non-smoker, healthy BMI, no family history of major illness, age 41', 'Portland, OR', NULL, NULL, NULL, 'active'),
        ('Riverstone Construction', 'commercial', 'workers_comp', 82, 'critical', 'High-rise construction, heavy equipment, subcontractor management', 'New York, NY', 'Construction', 35000000.00, 600, 'active'),
        ('Angela Davis', 'individual', 'health', 20, 'low', 'Non-smoker, controlled hypertension, regular checkups, age 44', 'Nashville, TN', NULL, NULL, NULL, 'active'),
        ('Metro Medical Associates', 'commercial', 'professional_liability', 55, 'medium', 'Medical malpractice exposure, multiple practitioners, surgical procedures', 'Houston, TX', 'Healthcare', 22000000.00, 180, 'active')
    `);
    console.log('  Seeded 15 risk assessments.');

    // ─── 6. UNDERWRITING RULES ──────────────────────────────────
    console.log('Creating underwriting_rules table...');
    await pool.query(`DROP TABLE IF EXISTS underwriting_rules CASCADE`);
    await pool.query(`
      CREATE TABLE underwriting_rules (
        id SERIAL PRIMARY KEY,
        rule_name VARCHAR(255) NOT NULL,
        rule_code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        condition_text TEXT,
        action_text TEXT,
        priority INTEGER DEFAULT 1,
        policy_type VARCHAR(100),
        threshold_value DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'active',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO underwriting_rules (rule_name, rule_code, category, condition_text, action_text, priority, policy_type, threshold_value, status, description) VALUES
        ('High Risk Score Referral', 'UW-001', 'risk_assessment', 'Risk score exceeds 75', 'Refer to senior underwriter for manual review', 1, 'all', 75.00, 'active', 'Automatically flags applications with elevated risk scores for senior review'),
        ('Auto Young Driver Surcharge', 'UW-002', 'pricing', 'Driver age under 25', 'Apply 25% premium surcharge', 2, 'auto', 25.00, 'active', 'Young driver surcharge applied to auto policies for drivers under 25'),
        ('Flood Zone Exclusion', 'UW-003', 'eligibility', 'Property located in FEMA Zone A or V', 'Decline standard coverage; offer NFIP referral', 1, 'home', 0.00, 'active', 'Properties in high-risk flood zones require separate flood insurance'),
        ('Commercial Revenue Cap', 'UW-004', 'eligibility', 'Annual revenue exceeds $50M', 'Require excess liability review and reinsurance approval', 2, 'commercial', 50000000.00, 'active', 'Large commercial accounts require additional review and reinsurance backing'),
        ('Life Insurance Medical Exam', 'UW-005', 'documentation', 'Coverage amount exceeds $500,000', 'Require paramedical examination and APS', 1, 'life', 500000.00, 'active', 'Higher face amounts require medical underwriting with exam and attending physician statement'),
        ('DUI Decline Rule', 'UW-006', 'eligibility', 'DUI/DWI conviction within past 5 years', 'Decline auto application', 1, 'auto', 0.00, 'active', 'Automatic decline for applicants with recent DUI/DWI convictions'),
        ('Multi-Policy Discount', 'UW-007', 'pricing', 'Customer holds 2 or more active policies', 'Apply 10% multi-policy discount', 3, 'all', 10.00, 'active', 'Loyalty discount for customers bundling multiple insurance products'),
        ('Cyber Liability Minimum Controls', 'UW-008', 'eligibility', 'No MFA or endpoint protection in place', 'Require cybersecurity remediation before binding', 1, 'commercial', 0.00, 'active', 'Minimum cybersecurity controls must be verified for cyber liability coverage'),
        ('Workers Comp Experience Mod', 'UW-009', 'pricing', 'Experience modification rate exceeds 1.25', 'Apply additional premium loading of 15%', 2, 'commercial', 1.25, 'active', 'Adverse experience modification results in premium surcharge'),
        ('Health Pre-existing Condition', 'UW-010', 'pricing', 'Pre-existing condition disclosed in application', 'Apply condition-specific rating factor per actuarial table', 2, 'health', 0.00, 'active', 'Rating adjustment for disclosed pre-existing conditions per ACA guidelines'),
        ('Property Age Surcharge', 'UW-011', 'pricing', 'Building age exceeds 50 years', 'Apply 20% premium surcharge and require inspection', 2, 'home', 50.00, 'active', 'Older structures require inspection and carry higher premiums due to material degradation'),
        ('Claims Frequency Cap', 'UW-012', 'risk_assessment', 'Three or more claims in 24 months', 'Non-renew at next anniversary or apply 40% surcharge', 1, 'all', 3.00, 'active', 'High claims frequency triggers non-renewal consideration or significant surcharge'),
        ('Commercial Fleet Minimum', 'UW-013', 'eligibility', 'Fleet size under 5 vehicles', 'Route to personal auto department', 3, 'commercial', 5.00, 'active', 'Commercial fleet policies require minimum vehicle count; smaller fleets use personal lines'),
        ('Life Tobacco Rating', 'UW-014', 'pricing', 'Tobacco use within past 12 months', 'Apply tobacco user mortality table rates', 1, 'life', 0.00, 'active', 'Tobacco users are rated using separate mortality tables with higher premiums'),
        ('Umbrella Underlying Limits', 'UW-015', 'eligibility', 'Underlying auto or home limits below required minimum', 'Require increase of underlying limits before binding umbrella', 1, 'commercial', 300000.00, 'active', 'Umbrella/excess policies require adequate underlying coverage limits')
    `);
    console.log('  Seeded 15 underwriting rules.');

    // ─── 7. FRAUD ALERTS ────────────────────────────────────────
    console.log('Creating fraud_alerts table...');
    await pool.query(`DROP TABLE IF EXISTS fraud_alerts CASCADE`);
    await pool.query(`
      CREATE TABLE fraud_alerts (
        id SERIAL PRIMARY KEY,
        alert_number VARCHAR(50) UNIQUE NOT NULL,
        policy_number VARCHAR(50),
        claim_number VARCHAR(50),
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50),
        description TEXT,
        indicators TEXT,
        suspect_name VARCHAR(255),
        estimated_loss DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO fraud_alerts (alert_number, policy_number, claim_number, alert_type, severity, description, indicators, suspect_name, estimated_loss, status) VALUES
        ('FRD-2024-0001', 'POL-2024-0006', 'CLM-2024-0005', 'staged_theft', 'high', 'Vehicle theft claim filed 3 days after policy inception. GPS data inconsistent with reported timeline.', 'New policy, high-value vehicle, GPS discrepancy, no witnesses', 'David Park', 45000.00, 'investigating'),
        ('FRD-2024-0002', 'POL-2024-0004', 'CLM-2024-0003', 'exaggerated_claim', 'medium', 'Injury claim amounts significantly exceed comparable cases. Claimant has history of similar claims.', 'Excessive medical billing, prior claim history, same attorney', 'Unknown Visitor', 150000.00, 'open'),
        ('FRD-2024-0003', 'POL-2024-0001', NULL, 'application_fraud', 'medium', 'Applicant may have misrepresented driving history. DMV records show undisclosed violations.', 'Omitted violations, inconsistent address history', 'John Martinez', 5000.00, 'resolved'),
        ('FRD-2024-0004', NULL, NULL, 'identity_theft', 'critical', 'Multiple policy applications using same SSN with different names and addresses within 48 hours.', 'Duplicate SSN, multiple identities, rapid applications, different states', 'Unknown', 200000.00, 'investigating'),
        ('FRD-2024-0005', 'POL-2024-0009', 'CLM-2024-0009', 'inflated_loss', 'high', 'Cyber breach claim includes business interruption losses that exceed reasonable projections based on company revenue.', 'Inflated revenue claims, inconsistent financial records, delayed reporting', 'TechVenture Inc', 250000.00, 'open'),
        ('FRD-2024-0006', 'POL-2024-0007', 'CLM-2024-0006', 'arson_suspicion', 'critical', 'Kitchen fire occurred during financial distress period. Insurance recently increased. Fire origin under investigation.', 'Financial difficulty, recent coverage increase, fire cause undetermined', 'Coastal Dining Group', 28000.00, 'investigating'),
        ('FRD-2024-0007', 'POL-2024-0011', NULL, 'premium_fraud', 'low', 'Policyholder may have understated annual mileage to reduce premium. Odometer check shows higher usage.', 'Mileage discrepancy, commute distance inconsistent', 'James O''Brien', 2000.00, 'resolved'),
        ('FRD-2024-0008', NULL, NULL, 'provider_fraud', 'high', 'Medical provider submitting duplicate billings across multiple insurance carriers for same procedures.', 'Duplicate CPT codes, multiple carrier billing, excessive charges', 'Dr. Raymond Foster', 180000.00, 'investigating'),
        ('FRD-2025-0009', 'POL-2025-0015', 'CLM-2025-0013', 'staged_accident', 'high', 'Fleet accident may be staged. Damage patterns inconsistent with reported speed and impact angle.', 'Inconsistent damage, no independent witnesses, driver history', 'Summit Logistics LLC', 67000.00, 'open'),
        ('FRD-2025-0010', 'POL-2024-0002', 'CLM-2025-0014', 'slip_and_fall_ring', 'medium', 'Claimant linked to network of similar slip-and-fall claims across multiple properties and insurers.', 'Multiple prior claims, linked addresses, same legal representation', 'Unknown Guest', 55000.00, 'investigating'),
        ('FRD-2025-0011', 'POL-2024-0012', 'CLM-2024-0010', 'crop_fraud', 'medium', 'Reported crop losses exceed reasonable estimates based on satellite imagery and weather station data.', 'Satellite imagery mismatch, inflated acreage, yield history discrepancy', 'Greenfield Farms Co', 85000.00, 'open'),
        ('FRD-2025-0012', NULL, NULL, 'agent_fraud', 'critical', 'Agent suspected of premium diversion. Client payments not reflected in carrier systems.', 'Missing premiums, forged documents, client complaints', 'Marcus Webb', 320000.00, 'investigating'),
        ('FRD-2025-0013', 'POL-2025-0014', 'CLM-2025-0012', 'property_fraud', 'low', 'Storm damage claim includes pre-existing roof deterioration visible in prior inspection photos.', 'Pre-existing damage, inspection photo comparison, age of materials', 'Kevin Nguyen', 8000.00, 'resolved'),
        ('FRD-2025-0014', 'POL-2024-0003', NULL, 'misrepresentation', 'high', 'Life insurance applicant may have concealed smoking history. Social media and pharmacy records suggest tobacco use.', 'Social media evidence, pharmacy records, contradicts application', 'Robert Williams', 15000.00, 'open'),
        ('FRD-2025-0015', NULL, NULL, 'phantom_vehicle', 'medium', 'VIN submitted for auto policy does not match any registered vehicle in national database.', 'Invalid VIN, no registration history, stock photo submitted', 'Unknown', 35000.00, 'investigating')
    `);
    console.log('  Seeded 15 fraud alerts.');

    // ─── 8. PREMIUM CALCULATIONS ────────────────────────────────
    console.log('Creating premium_calculations table...');
    await pool.query(`DROP TABLE IF EXISTS premium_calculations CASCADE`);
    await pool.query(`
      CREATE TABLE premium_calculations (
        id SERIAL PRIMARY KEY,
        calculation_name VARCHAR(255) NOT NULL,
        policy_type VARCHAR(100) NOT NULL,
        base_premium DECIMAL(15,2),
        risk_multiplier DECIMAL(5,3),
        coverage_amount DECIMAL(15,2),
        deductible DECIMAL(15,2),
        customer_name VARCHAR(255),
        factors TEXT,
        final_premium DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO premium_calculations (calculation_name, policy_type, base_premium, risk_multiplier, coverage_amount, deductible, customer_name, factors, final_premium, status) VALUES
        ('Auto Standard - Martinez', 'auto', 900.00, 1.10, 50000.00, 500.00, 'John Martinez', 'Good driver discount -10%, multi-policy -5%, urban area +15%', 1200.00, 'completed'),
        ('Homeowners HO-3 - Chen', 'home', 2200.00, 1.05, 450000.00, 1000.00, 'Sarah Chen', 'New roof credit -8%, security system -5%, coastal proximity +18%', 2800.00, 'completed'),
        ('Term Life 30yr - Williams', 'life', 2800.00, 1.15, 1000000.00, 0.00, 'Robert Williams', 'Non-smoker -15%, healthy BMI -5%, male +10%, age factor +25%', 3600.00, 'completed'),
        ('CGL - Apex Manufacturing', 'commercial', 18000.00, 1.33, 5000000.00, 5000.00, 'Apex Manufacturing LLC', 'Manufacturing class +40%, safety program -8%, claims history +12%, revenue factor +10%', 24000.00, 'completed'),
        ('Health PPO - Johnson', 'health', 3800.00, 1.05, 500000.00, 2000.00, 'Emily Johnson', 'Non-smoker -10%, preventive care credit -5%, age 32 base rate, family plan +35%', 4800.00, 'completed'),
        ('Auto Full - Park', 'auto', 1400.00, 1.20, 75000.00, 750.00, 'David Park', 'At-fault accident +20%, high-value vehicle +15%, urban parking +10%, anti-theft -5%', 1800.00, 'completed'),
        ('Restaurant CGL - Coastal', 'commercial', 11000.00, 1.25, 3000000.00, 2500.00, 'Coastal Dining Group', 'Food service class +30%, liquor liability +15%, fire suppression -10%, coastal +10%', 15000.00, 'completed'),
        ('Homeowners HO-3 - Gonzalez', 'home', 1500.00, 1.10, 320000.00, 1500.00, 'Maria Gonzalez', 'Standard construction, moderate wind zone +10%, no prior claims -5%', 1950.00, 'pending'),
        ('Tech E&O + Cyber - TechVenture', 'commercial', 30000.00, 1.30, 10000000.00, 10000.00, 'TechVenture Inc', 'Technology class +25%, data volume +20%, SOC 2 certified -10%, remote workforce +8%', 42000.00, 'completed'),
        ('Term Life 25yr - Thompson', 'life', 1400.00, 1.08, 500000.00, 0.00, 'Lisa Thompson', 'Non-smoker -15%, female -8%, healthy lifestyle -5%, age 41 factor +20%', 1800.00, 'completed'),
        ('Auto Liability - O''Brien', 'auto', 750.00, 1.15, 35000.00, 500.00, 'James O''Brien', 'Young driver +25%, speeding violations +15%, urban +10%, economy vehicle -10%', 950.00, 'completed'),
        ('Farm Package - Greenfield', 'commercial', 7200.00, 1.18, 2000000.00, 3000.00, 'Greenfield Farms Co', 'Crop diversification -5%, equipment value +10%, weather zone +15%, irrigation -8%', 9500.00, 'completed'),
        ('Health Family - Davis', 'health', 4800.00, 1.10, 750000.00, 1500.00, 'Angela Davis', 'Family plan +35%, controlled condition +8%, preventive care -5%, non-smoker -10%', 6200.00, 'completed'),
        ('Homeowners HV - Nguyen', 'home', 2600.00, 1.15, 580000.00, 2000.00, 'Kevin Nguyen', 'High-value dwelling +20%, scheduled property +10%, security system -8%, new construction -12%', 3400.00, 'completed'),
        ('Fleet + Cargo - Summit', 'commercial', 27000.00, 1.25, 8000000.00, 7500.00, 'Summit Logistics LLC', 'Fleet size 45 vehicles +30%, hazmat +15%, GPS tracking -8%, safety record -10%', 36000.00, 'completed')
    `);
    console.log('  Seeded 15 premium calculations.');

    // ─── 9. DOCUMENTS ───────────────────────────────────────────
    console.log('Creating documents table...');
    await pool.query(`DROP TABLE IF EXISTS documents CASCADE`);
    await pool.query(`
      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        document_name VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        policy_number VARCHAR(50),
        customer_name VARCHAR(255),
        content_summary TEXT,
        file_size VARCHAR(50),
        classification VARCHAR(100),
        confidence_score DECIMAL(5,3),
        status VARCHAR(50) DEFAULT 'processed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO documents (document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score, status) VALUES
        ('Martinez_Auto_Application.pdf', 'application', 'POL-2024-0001', 'John Martinez', 'Standard auto insurance application with driver history and vehicle details for 2022 Toyota Camry', '2.4 MB', 'auto_application', 0.965, 'processed'),
        ('Chen_Property_Inspection.pdf', 'inspection_report', 'POL-2024-0002', 'Sarah Chen', 'Property inspection report for 1890 Oak Avenue. Construction: wood frame, 2018 build, excellent condition.', '5.1 MB', 'property_inspection', 0.982, 'processed'),
        ('Williams_Medical_Exam.pdf', 'medical_report', 'POL-2024-0003', 'Robert Williams', 'Paramedical examination results. BP 118/76, BMI 23.4, non-smoker, no significant findings.', '1.8 MB', 'life_medical', 0.971, 'processed'),
        ('Apex_CGL_Endorsement.pdf', 'endorsement', 'POL-2024-0004', 'Apex Manufacturing LLC', 'Additional insured endorsement adding Apex parent company and waiver of subrogation.', '890 KB', 'commercial_endorsement', 0.944, 'processed'),
        ('Johnson_EOB_May2024.pdf', 'explanation_of_benefits', 'POL-2024-0005', 'Emily Johnson', 'Explanation of benefits for emergency appendectomy. Total charges $15,200, plan paid $12,000.', '1.2 MB', 'health_eob', 0.958, 'processed'),
        ('Park_Police_Report_24-77892.pdf', 'police_report', 'POL-2024-0006', 'David Park', 'Police report for vehicle theft. Filed 07/20/2024. Vehicle recovered 08/02/2024 with damage.', '3.6 MB', 'claims_documentation', 0.991, 'processed'),
        ('Coastal_Fire_Marshal_Report.pdf', 'investigation_report', 'POL-2024-0007', 'Coastal Dining Group', 'Fire investigation report. Origin: kitchen grease trap. Cause: accidental. No code violations found.', '4.2 MB', 'claims_investigation', 0.977, 'processed'),
        ('TechVenture_SOC2_Report.pdf', 'compliance_report', 'POL-2024-0009', 'TechVenture Inc', 'SOC 2 Type II audit report covering security, availability, and confidentiality trust service criteria.', '8.7 MB', 'cyber_compliance', 0.988, 'processed'),
        ('Greenfield_Yield_History.pdf', 'actuarial_data', 'POL-2024-0012', 'Greenfield Farms Co', 'Five-year crop yield history for corn and soybean production. Includes USDA county averages.', '1.5 MB', 'agricultural_data', 0.935, 'processed'),
        ('Summit_Fleet_Schedule.xlsx', 'fleet_schedule', 'POL-2025-0015', 'Summit Logistics LLC', 'Complete vehicle schedule listing 45 trucks with VINs, values, driver assignments, and maintenance records.', '3.8 MB', 'commercial_fleet', 0.962, 'processed'),
        ('Martinez_Claim_Photos.zip', 'claim_evidence', 'POL-2024-0001', 'John Martinez', 'Photographs of vehicle damage from rear-end collision. 12 images showing bumper, trunk, and frame damage.', '18.5 MB', 'claims_photos', 0.997, 'processed'),
        ('OBrien_MVR_Report.pdf', 'motor_vehicle_record', 'POL-2024-0011', 'James O''Brien', 'Motor vehicle record showing two speeding violations in past 36 months. No accidents on record.', '420 KB', 'auto_mvr', 0.989, 'processed'),
        ('Davis_Health_Records.pdf', 'medical_records', 'POL-2024-0013', 'Angela Davis', 'Medical records summary: controlled hypertension (lisinopril 10mg), annual physical current, BMI 26.1.', '2.1 MB', 'health_medical', 0.974, 'processed'),
        ('Nguyen_Appraisal_Report.pdf', 'property_appraisal', 'POL-2025-0014', 'Kevin Nguyen', 'Home appraisal report. Estimated replacement cost $580,000. Includes scheduled jewelry and art inventory.', '6.3 MB', 'property_appraisal', 0.956, 'processed'),
        ('Reinsurance_Treaty_2025.pdf', 'treaty_document', NULL, NULL, 'Excess of loss reinsurance treaty with Swiss Re for 2025. Covers catastrophic losses above $5M retention.', '12.4 MB', 'reinsurance', 0.948, 'processed')
    `);
    console.log('  Seeded 15 documents.');

    // ─── 10. COMPLIANCE RECORDS ─────────────────────────────────
    console.log('Creating compliance_records table...');
    await pool.query(`DROP TABLE IF EXISTS compliance_records CASCADE`);
    await pool.query(`
      CREATE TABLE compliance_records (
        id SERIAL PRIMARY KEY,
        regulation_name VARCHAR(255) NOT NULL,
        regulation_code VARCHAR(100),
        category VARCHAR(100),
        jurisdiction VARCHAR(100),
        requirement TEXT,
        compliance_status VARCHAR(50) DEFAULT 'compliant',
        due_date DATE,
        responsible_party VARCHAR(255),
        findings TEXT,
        severity VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO compliance_records (regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status, due_date, responsible_party, findings, severity) VALUES
        ('NAIC Model Audit Rule', 'MAR-2024', 'financial_reporting', 'Federal', 'Annual audited financial statements filed with state insurance departments', 'compliant', '2025-03-31', 'CFO - Margaret Chen', 'Annual audit completed by Deloitte. No material findings.', 'low'),
        ('California Insurance Code 790.03', 'CA-790.03', 'claims_handling', 'California', 'Fair claims settlement practices - timely acknowledgment and investigation of claims', 'compliant', '2025-06-30', 'Claims Director - Tom Harris', 'Average acknowledgment time 1.2 days. Within 15-day statutory requirement.', 'low'),
        ('HIPAA Privacy Rule', 'HIPAA-PR', 'data_privacy', 'Federal', 'Protection of individually identifiable health information in insurance operations', 'compliant', '2025-12-31', 'CISO - Robert Lang', 'Annual HIPAA training completed. PHI handling procedures updated Q1 2025.', 'medium'),
        ('AML/KYC Requirements', 'AML-BSA', 'anti_fraud', 'Federal', 'Anti-money laundering and know-your-customer protocols for policy issuance', 'non_compliant', '2025-04-15', 'Compliance Officer - Diana Ruiz', 'Gap identified in commercial account verification process. Remediation plan submitted.', 'high'),
        ('Sarbanes-Oxley Section 302', 'SOX-302', 'financial_controls', 'Federal', 'CEO/CFO certification of internal controls over financial reporting', 'compliant', '2025-03-15', 'CEO / CFO', 'Internal controls tested and certified. No material weaknesses identified.', 'medium'),
        ('State Rate Filing - Texas', 'TX-RF-2025', 'rate_regulation', 'Texas', 'Prior approval rate filing for personal auto insurance rate changes', 'pending_review', '2025-05-01', 'Actuarial Director - James Wu', 'Rate filing submitted 02/15/2025. 8.5% increase requested. TDI review in progress.', 'medium'),
        ('GDPR Data Processing', 'GDPR-DP', 'data_privacy', 'EU', 'Lawful processing of personal data for EU-based policyholders and claimants', 'compliant', '2025-12-31', 'DPO - Anna Schmidt', 'Data processing agreements updated. Privacy impact assessments current.', 'high'),
        ('NAIC Cybersecurity Model Law', 'NAIC-CML', 'cybersecurity', 'Multi-State', 'Comprehensive cybersecurity program with risk assessment and incident response plan', 'compliant', '2025-09-30', 'CISO - Robert Lang', 'Cybersecurity program reviewed and approved. Penetration testing completed Q4 2024.', 'high'),
        ('Florida Hurricane Catastrophe Fund', 'FL-FHCF', 'catastrophe_reporting', 'Florida', 'Annual exposure reporting for residential property policies in Florida', 'compliant', '2025-07-01', 'Actuarial Director - James Wu', 'Exposure data submitted on schedule. $45M in Florida residential exposure reported.', 'medium'),
        ('New York Regulation 187', 'NY-REG187', 'sales_practices', 'New York', 'Suitability and best interest standards for life insurance and annuity transactions', 'compliant', '2025-12-31', 'Sales VP - Michael Torres', 'Agent training updated. Suitability documentation procedures enhanced.', 'medium'),
        ('Workers Compensation Reporting', 'WC-NCCI', 'statistical_reporting', 'Multi-State', 'Unit statistical data reporting to NCCI for workers compensation experience rating', 'pending_review', '2025-04-30', 'Actuarial Director - James Wu', 'Q4 2024 data compiled. Validation checks in progress before submission.', 'low'),
        ('OFAC Sanctions Screening', 'OFAC-SDN', 'sanctions', 'Federal', 'Screening of all policyholders and claimants against OFAC Specially Designated Nationals list', 'compliant', '2025-12-31', 'Compliance Officer - Diana Ruiz', 'Automated screening integrated into policy issuance workflow. Daily list updates confirmed.', 'critical'),
        ('State Guaranty Fund Assessment', 'SGA-2025', 'financial_obligations', 'Multi-State', 'Payment of state guaranty fund assessments based on premium volume', 'compliant', '2025-06-30', 'CFO - Margaret Chen', 'All 2024 assessments paid. 2025 estimates accrued per state requirements.', 'low'),
        ('Market Conduct Examination - Illinois', 'IL-MCE-2024', 'market_conduct', 'Illinois', 'Triennial market conduct examination covering claims, underwriting, and rating practices', 'under_review', '2025-08-15', 'Compliance Officer - Diana Ruiz', 'Examination commenced 01/2025. Document requests fulfilled. On-site review scheduled April.', 'medium'),
        ('Dodd-Frank Whistleblower Program', 'DF-WB', 'corporate_governance', 'Federal', 'Establishment and maintenance of whistleblower reporting mechanisms and protections', 'compliant', '2025-12-31', 'General Counsel - Patricia Alvarez', 'Hotline operational. Annual training completed. Zero retaliation complaints.', 'medium')
    `);
    console.log('  Seeded 15 compliance records.');

    // ─── 11. REINSURANCE TREATIES ───────────────────────────────
    console.log('Creating reinsurance_treaties table...');
    await pool.query(`DROP TABLE IF EXISTS reinsurance_treaties CASCADE`);
    await pool.query(`
      CREATE TABLE reinsurance_treaties (
        id SERIAL PRIMARY KEY,
        treaty_name VARCHAR(255) NOT NULL,
        treaty_number VARCHAR(50) UNIQUE NOT NULL,
        reinsurer_name VARCHAR(255) NOT NULL,
        treaty_type VARCHAR(100),
        coverage_limit DECIMAL(15,2),
        retention_amount DECIMAL(15,2),
        premium_rate DECIMAL(5,3),
        effective_date DATE,
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO reinsurance_treaties (treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status) VALUES
        ('Property Catastrophe XOL Layer 1', 'RT-2025-001', 'Swiss Re', 'excess_of_loss', 25000000.00, 5000000.00, 0.085, '2025-01-01', '2025-12-31', 'active'),
        ('Property Catastrophe XOL Layer 2', 'RT-2025-002', 'Munich Re', 'excess_of_loss', 50000000.00, 25000000.00, 0.065, '2025-01-01', '2025-12-31', 'active'),
        ('Casualty Quota Share', 'RT-2025-003', 'Hannover Re', 'quota_share', 10000000.00, 6000000.00, 0.320, '2025-01-01', '2025-12-31', 'active'),
        ('Auto Liability XOL', 'RT-2025-004', 'SCOR', 'excess_of_loss', 15000000.00, 2000000.00, 0.072, '2025-01-01', '2025-12-31', 'active'),
        ('Workers Comp Aggregate Stop Loss', 'RT-2025-005', 'Gen Re', 'aggregate_stop_loss', 20000000.00, 8000000.00, 0.045, '2025-01-01', '2025-12-31', 'active'),
        ('Life Surplus Treaty', 'RT-2025-006', 'RGA', 'surplus', 5000000.00, 500000.00, 0.110, '2025-01-01', '2025-12-31', 'active'),
        ('Marine Cargo Facultative', 'RT-2025-007', 'Lloyd''s Syndicate 2003', 'facultative', 8000000.00, 1500000.00, 0.092, '2025-03-01', '2026-02-28', 'active'),
        ('Cyber Liability XOL', 'RT-2025-008', 'Everest Re', 'excess_of_loss', 30000000.00, 5000000.00, 0.120, '2025-01-01', '2025-12-31', 'active'),
        ('Property Per-Risk XOL', 'RT-2025-009', 'PartnerRe', 'excess_of_loss', 10000000.00, 3000000.00, 0.058, '2025-01-01', '2025-12-31', 'active'),
        ('Health Quota Share', 'RT-2025-010', 'Transatlantic Re', 'quota_share', 12000000.00, 7200000.00, 0.280, '2025-01-01', '2025-12-31', 'active'),
        ('Commercial Property Surplus', 'RT-2025-011', 'Odyssey Re', 'surplus', 15000000.00, 4000000.00, 0.095, '2025-01-01', '2025-12-31', 'active'),
        ('Hurricane Wind XOL', 'RT-2024-012', 'Renaissance Re', 'excess_of_loss', 100000000.00, 10000000.00, 0.145, '2024-06-01', '2025-05-31', 'active'),
        ('Professional Liability QS', 'RT-2025-013', 'Arch Re', 'quota_share', 8000000.00, 4800000.00, 0.300, '2025-01-01', '2025-12-31', 'active'),
        ('Flood Catastrophe Bond', 'RT-2025-014', 'Nephila Capital', 'catastrophe_bond', 40000000.00, 15000000.00, 0.055, '2025-04-01', '2028-03-31', 'active'),
        ('Excess Casualty Fac Cert', 'RT-2024-015', 'Berkley Re', 'facultative', 5000000.00, 2000000.00, 0.078, '2024-07-01', '2025-06-30', 'expiring')
    `);
    console.log('  Seeded 15 reinsurance treaties.');

    // ─── 12. LOSS RATIOS ────────────────────────────────────────
    console.log('Creating loss_ratios table...');
    await pool.query(`DROP TABLE IF EXISTS loss_ratios CASCADE`);
    await pool.query(`
      CREATE TABLE loss_ratios (
        id SERIAL PRIMARY KEY,
        analysis_name VARCHAR(255) NOT NULL,
        policy_type VARCHAR(100) NOT NULL,
        period VARCHAR(50),
        earned_premium DECIMAL(15,2),
        incurred_losses DECIMAL(15,2),
        loss_ratio DECIMAL(5,3),
        expense_ratio DECIMAL(5,3),
        combined_ratio DECIMAL(5,3),
        trend VARCHAR(50),
        status VARCHAR(50) DEFAULT 'final',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO loss_ratios (analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend, status) VALUES
        ('Auto Q1 2024 Analysis', 'auto', 'Q1 2024', 4500000.00, 2700000.00, 0.600, 0.280, 0.880, 'stable', 'final'),
        ('Auto Q2 2024 Analysis', 'auto', 'Q2 2024', 4800000.00, 3120000.00, 0.650, 0.275, 0.925, 'increasing', 'final'),
        ('Home Q1 2024 Analysis', 'home', 'Q1 2024', 3200000.00, 1760000.00, 0.550, 0.300, 0.850, 'stable', 'final'),
        ('Home Q2 2024 Analysis', 'home', 'Q2 2024', 3400000.00, 2380000.00, 0.700, 0.295, 0.995, 'increasing', 'final'),
        ('Commercial Q1 2024 Analysis', 'commercial', 'Q1 2024', 8500000.00, 5100000.00, 0.600, 0.310, 0.910, 'stable', 'final'),
        ('Commercial Q2 2024 Analysis', 'commercial', 'Q2 2024', 9200000.00, 5980000.00, 0.650, 0.305, 0.955, 'increasing', 'final'),
        ('Life FY 2024 Analysis', 'life', 'FY 2024', 6000000.00, 2400000.00, 0.400, 0.250, 0.650, 'decreasing', 'final'),
        ('Health Q1 2024 Analysis', 'health', 'Q1 2024', 5500000.00, 4400000.00, 0.800, 0.150, 0.950, 'stable', 'final'),
        ('Health Q2 2024 Analysis', 'health', 'Q2 2024', 5800000.00, 4930000.00, 0.850, 0.155, 1.005, 'increasing', 'final'),
        ('Auto Q3 2024 Analysis', 'auto', 'Q3 2024', 5100000.00, 3315000.00, 0.650, 0.270, 0.920, 'stable', 'final'),
        ('Home Q3 2024 Analysis', 'home', 'Q3 2024', 3600000.00, 2520000.00, 0.700, 0.290, 0.990, 'increasing', 'final'),
        ('Commercial Q3 2024 Analysis', 'commercial', 'Q3 2024', 9800000.00, 5880000.00, 0.600, 0.300, 0.900, 'decreasing', 'final'),
        ('Auto Q4 2024 Analysis', 'auto', 'Q4 2024', 5300000.00, 3710000.00, 0.700, 0.268, 0.968, 'increasing', 'preliminary'),
        ('Home Q4 2024 Analysis', 'home', 'Q4 2024', 3800000.00, 2280000.00, 0.600, 0.288, 0.888, 'decreasing', 'preliminary'),
        ('All Lines FY 2024 Summary', 'all', 'FY 2024', 42000000.00, 27300000.00, 0.650, 0.280, 0.930, 'stable', 'preliminary')
    `);
    console.log('  Seeded 15 loss ratios.');

    // ─── 13. AGENTS / BROKERS ───────────────────────────────────
    console.log('Creating agents_brokers table...');
    await pool.query(`DROP TABLE IF EXISTS agents_brokers CASCADE`);
    await pool.query(`
      CREATE TABLE agents_brokers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        agent_type VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        agency_name VARCHAR(255),
        commission_rate DECIMAL(5,3),
        total_policies INTEGER DEFAULT 0,
        total_premium DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO agents_brokers (name, license_number, agent_type, email, phone, agency_name, commission_rate, total_policies, total_premium, status) VALUES
        ('Patricia Alvarez', 'AG-TX-44821', 'captive', 'palvarez@insuranceai.com', '555-0201', 'InsuranceAI Direct', 0.120, 85, 425000.00, 'active'),
        ('Michael Torres', 'AG-CA-55932', 'independent', 'mtorres@westcoastins.com', '555-0202', 'West Coast Insurance Group', 0.150, 120, 890000.00, 'active'),
        ('Rachel Kim', 'AG-NY-33187', 'broker', 'rkim@empirebrokerage.com', '555-0203', 'Empire Brokerage LLC', 0.100, 200, 2400000.00, 'active'),
        ('Daniel Murphy', 'AG-IL-22456', 'captive', 'dmurphy@insuranceai.com', '555-0204', 'InsuranceAI Direct', 0.120, 72, 360000.00, 'active'),
        ('Sandra Williams', 'AG-FL-66743', 'independent', 'swilliams@sunshineins.com', '555-0205', 'Sunshine Insurance Agency', 0.145, 95, 520000.00, 'active'),
        ('Marcus Webb', 'AG-GA-77891', 'independent', 'mwebb@southernprotect.com', '555-0206', 'Southern Protect Insurance', 0.140, 65, 310000.00, 'suspended'),
        ('Jennifer Chang', 'AG-WA-88234', 'broker', 'jchang@pacificbrokers.com', '555-0207', 'Pacific Insurance Brokers', 0.105, 150, 1850000.00, 'active'),
        ('Christopher Lee', 'AG-MA-11567', 'captive', 'clee@insuranceai.com', '555-0208', 'InsuranceAI Direct', 0.120, 58, 290000.00, 'active'),
        ('Amanda Foster', 'AG-CO-99321', 'independent', 'afoster@mountainins.com', '555-0209', 'Mountain State Insurance', 0.135, 88, 480000.00, 'active'),
        ('Brian Patel', 'AG-TX-44955', 'broker', 'bpatel@lonestarbrokers.com', '555-0210', 'Lone Star Brokers Inc', 0.110, 175, 2100000.00, 'active'),
        ('Nicole Robinson', 'AG-OH-55678', 'independent', 'nrobinson@heartlandins.com', '555-0211', 'Heartland Insurance Agency', 0.142, 92, 540000.00, 'active'),
        ('Steven Garcia', 'AG-AZ-66289', 'captive', 'sgarcia@insuranceai.com', '555-0212', 'InsuranceAI Direct', 0.120, 48, 240000.00, 'active'),
        ('Laura Bennett', 'AG-PA-77412', 'broker', 'lbennett@keystonebrokers.com', '555-0213', 'Keystone Insurance Brokers', 0.108, 130, 1600000.00, 'active'),
        ('Ryan Mitchell', 'AG-TN-88645', 'independent', 'rmitchell@volunteerins.com', '555-0214', 'Volunteer Insurance Group', 0.138, 78, 420000.00, 'active'),
        ('Catherine Nguyen', 'AG-OR-99778', 'independent', 'cnguyen@northwestins.com', '555-0215', 'Northwest Insurance Partners', 0.148, 105, 680000.00, 'active')
    `);
    console.log('  Seeded 15 agents/brokers.');

    // ─── 14. AUDIT LOGS ─────────────────────────────────────────
    console.log('Creating audit_logs table...');
    await pool.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
    await pool.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(50),
        user_name VARCHAR(255),
        user_role VARCHAR(50),
        ip_address VARCHAR(50),
        details TEXT,
        old_value TEXT,
        new_value TEXT,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_name, user_role, ip_address, details, old_value, new_value, status, created_at) VALUES
        ('LOGIN', 'user', '1', 'Admin User', 'admin', '192.168.1.100', 'Successful admin login via SSO', NULL, NULL, 'success', '2025-03-10 08:15:22'),
        ('CREATE_POLICY', 'policy', 'POL-2025-0015', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'New commercial fleet policy created for Summit Logistics LLC', NULL, 'POL-2025-0015', 'success', '2025-02-01 10:30:00'),
        ('UPDATE_CLAIM', 'claim', 'CLM-2024-0001', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'Claim status updated after adjuster review completed', 'under_review', 'approved', 'success', '2025-01-15 14:22:18'),
        ('APPROVE_PAYMENT', 'claim', 'CLM-2024-0004', 'Admin User', 'admin', '192.168.1.100', 'Claim payment of $12,000 approved for Emily Johnson medical claim', NULL, '$12,000.00', 'success', '2024-06-10 09:45:33'),
        ('RUN_RISK_ASSESSMENT', 'risk_assessment', '6', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'Automated risk assessment executed for Summit Logistics LLC fleet policy', NULL, 'Score: 78 - High', 'success', '2025-01-28 11:20:00'),
        ('EXPORT_REPORT', 'report', '3', 'Admin User', 'admin', '192.168.1.100', 'Quarterly loss ratio report exported to PDF', NULL, NULL, 'success', '2025-01-05 16:00:45'),
        ('UPDATE_RULE', 'underwriting_rule', 'UW-002', 'Admin User', 'admin', '192.168.1.100', 'Young driver surcharge threshold updated', 'Age < 21', 'Age < 25', 'success', '2024-12-15 13:10:22'),
        ('FLAG_FRAUD', 'fraud_alert', 'FRD-2024-0001', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'Fraud alert created for suspicious vehicle theft claim', NULL, 'FRD-2024-0001', 'success', '2024-08-05 10:55:00'),
        ('DELETE_DOCUMENT', 'document', '99', 'Admin User', 'admin', '192.168.1.100', 'Duplicate document removed from system', 'Duplicate_file.pdf', NULL, 'success', '2025-02-20 15:30:12'),
        ('FAILED_LOGIN', 'user', NULL, 'unknown', 'none', '10.0.0.55', 'Failed login attempt - invalid credentials (3rd attempt)', NULL, NULL, 'failure', '2025-03-12 02:14:55'),
        ('UPDATE_CUSTOMER', 'customer', '4', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'Customer risk score recalculated after annual review', 'Risk Score: 50', 'Risk Score: 55', 'success', '2025-01-20 09:30:00'),
        ('BIND_POLICY', 'policy', 'POL-2025-0014', 'Jane Underwriter', 'underwriter', '192.168.1.105', 'High-value homeowners policy bound for Kevin Nguyen', 'quoted', 'active', 'success', '2025-01-02 11:00:00'),
        ('COMPLIANCE_CHECK', 'compliance', 'HIPAA-PR', 'Admin User', 'admin', '192.168.1.100', 'Annual HIPAA compliance verification completed', NULL, 'compliant', 'success', '2025-02-28 10:00:00'),
        ('SUSPEND_AGENT', 'agent', '6', 'Admin User', 'admin', '192.168.1.100', 'Agent Marcus Webb suspended pending fraud investigation', 'active', 'suspended', 'success', '2025-03-05 14:45:00'),
        ('SYSTEM_BACKUP', 'system', NULL, 'System', 'system', '127.0.0.1', 'Nightly database backup completed successfully', NULL, NULL, 'success', '2025-03-15 03:00:00')
    `);
    console.log('  Seeded 15 audit logs.');

    // ─── 15. REPORTS ────────────────────────────────────────────
    console.log('Creating reports table...');
    await pool.query(`DROP TABLE IF EXISTS reports CASCADE`);
    await pool.query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        report_name VARCHAR(255) NOT NULL,
        report_type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        period VARCHAR(50),
        generated_by VARCHAR(255),
        summary TEXT,
        total_policies INTEGER,
        total_premium DECIMAL(15,2),
        total_claims DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'final',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO reports (report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status) VALUES
        ('Q1 2024 Executive Summary', 'executive_summary', 'quarterly', 'Q1 2024', 'Admin User', 'Strong premium growth of 12% YoY. Combined ratio at 89.3%. New business pipeline healthy across all lines.', 1250, 16200000.00, 9450000.00, 'final'),
        ('Q2 2024 Executive Summary', 'executive_summary', 'quarterly', 'Q2 2024', 'Admin User', 'Elevated cat losses from spring storms impacted home line. Auto frequency trending up. Commercial stable.', 1310, 17400000.00, 12430000.00, 'final'),
        ('FY 2024 Annual Report', 'annual_report', 'annual', 'FY 2024', 'Admin User', 'Full year results: 8.5% premium growth, 93% combined ratio. Strategic investments in AI underwriting showing ROI.', 1420, 68500000.00, 44200000.00, 'final'),
        ('Auto Book Performance', 'line_of_business', 'auto', 'FY 2024', 'Jane Underwriter', 'Auto portfolio grew 6% in policy count. Frequency increased 3%. Severity up 8% driven by parts inflation.', 480, 19700000.00, 12800000.00, 'final'),
        ('Homeowners Book Performance', 'line_of_business', 'home', 'FY 2024', 'Jane Underwriter', 'Home portfolio loss ratio impacted by Q2/Q3 weather events. Rate increase filed in 6 states.', 320, 14000000.00, 8940000.00, 'final'),
        ('Commercial Lines Review', 'line_of_business', 'commercial', 'FY 2024', 'Jane Underwriter', 'Commercial lines achieved 91% combined ratio. New manufacturing vertical performing above plan.', 185, 27500000.00, 16960000.00, 'final'),
        ('Claims Department Monthly', 'operational', 'claims', 'Feb 2025', 'Tom Harris', 'February claims: 45 new, 38 closed. Average cycle time 22 days. Customer satisfaction 4.2/5.', NULL, NULL, 2800000.00, 'final'),
        ('Fraud Investigation Quarterly', 'fraud_analysis', 'fraud', 'Q4 2024', 'Diana Ruiz', 'SIU opened 12 cases, closed 8. Fraud savings of $450K. AI detection model accuracy at 94%.', NULL, NULL, 450000.00, 'final'),
        ('Reinsurance Program Review', 'reinsurance', 'treaties', 'FY 2025', 'Margaret Chen', '2025 treaty renewals completed. Average rate increase 4.2%. All layers placed. Cat bond extended to 2028.', NULL, 8500000.00, NULL, 'final'),
        ('Agent Production Report', 'production', 'agents', 'Feb 2025', 'Michael Torres', 'Top producers: Rachel Kim ($240K), Brian Patel ($210K). One agent suspended for investigation.', 1420, 5200000.00, NULL, 'final'),
        ('Compliance Status Dashboard', 'compliance', 'regulatory', 'Q1 2025', 'Diana Ruiz', '13 of 15 regulatory items compliant. AML gap remediation on track. IL market conduct exam in progress.', NULL, NULL, NULL, 'final'),
        ('Actuarial Reserve Analysis', 'actuarial', 'reserves', 'FY 2024', 'James Wu', 'IBNR reserves strengthened by $2.1M. Adequacy confirmed by independent actuary. No redundancies identified.', NULL, NULL, 44200000.00, 'final'),
        ('Underwriting Profitability', 'profitability', 'underwriting', 'FY 2024', 'Jane Underwriter', 'Underwriting income of $4.8M. Expense ratio improved 0.5 points. AI-assisted decisions up 35%.', 1420, 68500000.00, 44200000.00, 'final'),
        ('Customer Retention Analysis', 'retention', 'customers', 'FY 2024', 'Admin User', 'Overall retention rate 87%. Multi-policy households at 94%. At-risk segment identified for Q1 outreach.', 1420, 68500000.00, NULL, 'final'),
        ('Q1 2025 Preliminary Results', 'executive_summary', 'quarterly', 'Q1 2025', 'Admin User', 'Preliminary Q1 results: premium growth 10% YoY. Combined ratio 88.5%. New AI risk scoring deployed.', 1480, 18900000.00, 10200000.00, 'preliminary')
    `);
    console.log('  Seeded 15 reports.');

    // ─── 16. POLICY RENEWALS ────────────────────────────────────
    console.log('Creating policy_renewals table...');
    await pool.query(`DROP TABLE IF EXISTS policy_renewals CASCADE`);
    await pool.query(`
      CREATE TABLE policy_renewals (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        policy_type VARCHAR(100),
        current_premium DECIMAL(15,2),
        proposed_premium DECIMAL(15,2),
        renewal_date DATE,
        expiry_date DATE,
        risk_change VARCHAR(50),
        claims_history VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO policy_renewals (policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change, claims_history, status) VALUES
        ('POL-2024-0001', 'John Martinez', 'auto', 1200.00, 1380.00, '2025-01-15', '2026-01-15', 'increased', '2 claims in policy period - collision and comprehensive', 'approved'),
        ('POL-2024-0002', 'Sarah Chen', 'home', 2800.00, 3080.00, '2025-02-01', '2026-02-01', 'increased', '1 water damage claim ($35K) plus pending liability claim', 'pending'),
        ('POL-2024-0004', 'Apex Manufacturing LLC', 'commercial', 24000.00, 26400.00, '2025-01-01', '2026-01-01', 'increased', '1 open liability claim ($150K). Experience mod rising.', 'approved'),
        ('POL-2024-0005', 'Emily Johnson', 'health', 4800.00, 4944.00, '2025-04-01', '2026-04-01', 'stable', '1 approved medical claim within expected range', 'pending'),
        ('POL-2024-0006', 'David Park', 'auto', 1800.00, 2160.00, '2025-05-15', '2026-05-15', 'increased', '1 theft claim and 1 collision claim. Risk score elevated.', 'pending'),
        ('POL-2024-0007', 'Coastal Dining Group', 'commercial', 15000.00, 16500.00, '2025-06-01', '2026-06-01', 'increased', '1 fire damage claim ($28K). Fraud investigation pending.', 'under_review'),
        ('POL-2024-0008', 'Maria Gonzalez', 'home', 1950.00, 1950.00, '2025-07-01', '2026-07-01', 'stable', '1 pending hail damage claim. No prior claims history.', 'pending'),
        ('POL-2024-0009', 'TechVenture Inc', 'commercial', 42000.00, 50400.00, '2025-03-01', '2026-03-01', 'increased', 'Major cyber breach ($250K claim). Remediation required for renewal.', 'conditional'),
        ('POL-2024-0011', 'James O''Brien', 'auto', 950.00, 1140.00, '2025-01-01', '2026-01-01', 'increased', 'No claims but 2 additional speeding violations on MVR', 'non_renewed'),
        ('POL-2024-0012', 'Greenfield Farms Co', 'commercial', 9500.00, 10450.00, '2025-09-01', '2026-09-01', 'increased', 'Crop damage claim under review ($85K). Drought risk factor.', 'pending'),
        ('POL-2024-0013', 'Angela Davis', 'health', 6200.00, 6386.00, '2025-10-01', '2026-10-01', 'stable', '1 approved outpatient surgery. Routine utilization.', 'pending'),
        ('POL-2024-0001', 'John Martinez', 'auto', 1380.00, 1311.00, '2026-01-15', '2027-01-15', 'decreased', 'Clean record since last renewal. Eligible for claims-free discount.', 'quoted'),
        ('POL-2024-0002', 'Sarah Chen', 'home', 3080.00, 3234.00, '2026-02-01', '2027-02-01', 'stable', 'Prior claims closed. New roof installed - credit applicable.', 'quoted'),
        ('POL-2024-0003', 'Robert Williams', 'life', 3600.00, 3600.00, '2025-03-10', '2055-03-10', 'stable', 'No claims. Level premium term policy - no rate change at anniversary.', 'approved'),
        ('POL-2024-0010', 'Lisa Thompson', 'life', 1800.00, 1800.00, '2025-08-15', '2050-08-15', 'stable', 'No claims. Guaranteed level premium. Annual policy review complete.', 'approved')
    `);
    console.log('  Seeded 15 policy renewals.');

    console.log('\nDatabase seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Done.');
    pool.end();
  })
  .catch((err) => {
    console.error('Fatal seed error:', err);
    pool.end();
    process.exit(1);
  });
