import pool from "../config/db.js";

async function sync() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const employees = [
      {
        name: "Phạm Minh Quân",
        email: "employee_quan@voucher.vn",
        phone: "0903000034",
        cccd: "001095000034",
        gender: "MALE",
        branchId: 1,
        submittedAt: "2026-08-14 09:30:00",
      },
      {
        name: "Trần Ngọc Linh",
        email: "employee_linh@voucher.vn",
        phone: "0903000035",
        cccd: "001196000035",
        gender: "FEMALE",
        branchId: 3,
        submittedAt: "2026-08-15 14:15:00",
      },
      {
        name: "Lê Quốc Bảo",
        email: "employee_bao@voucher.vn",
        phone: "0903000036",
        cccd: "001097000036",
        gender: "MALE",
        branchId: 5,
        submittedAt: "2026-08-16 10:00:00",
      },
    ];

    for (const u of employees) {
      const check = await client.query("SELECT user_id FROM users WHERE email = $1", [u.email]);
      let uid = check.rows[0]?.user_id;

      if (!uid) {
        const ins = await client.query(
          `INSERT INTO users (full_name, email, phone, password_hash, role, gender, identity_no, nationality, status, created_at)
           VALUES ($1, $2, $3, $4, 'PARTNER_EMPLOYEE', $5, $6, 'Việt Nam', 'ACTIVE', $7)
           RETURNING user_id`,
          [
            u.name,
            u.email,
            u.phone,
            "$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW",
            u.gender,
            u.cccd,
            u.submittedAt,
          ]
        );
        uid = ins.rows[0].user_id;
      }

      await client.query(
        `INSERT INTO partner_employees (user_id, branch_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET branch_id = EXCLUDED.branch_id`,
        [uid, u.branchId]
      );

      await client.query("DELETE FROM partner_employee_approval_requests WHERE user_id = $1", [uid]);

      await client.query(
        `INSERT INTO partner_employee_approval_requests (user_id, submitted_at, approval_status)
         VALUES ($1, $2, 'PENDING')`,
        [uid, u.submittedAt]
      );
    }

    await client.query("COMMIT");
    console.log("Successfully seeded 3 pending employees to database.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error seeding pending employees:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

sync();
