// Clean demo data: Remove all demo restaurants, licenses, notifications, and payments
// Keep: templates, demo_sites, and the default "varsayilan-isletme" restaurant
// Run: npm run db:clean-demo

import "../env";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("Cleaning demo data...");

    // Disable foreign key checks temporarily
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // Get the default demo business ID (varsayilan-isletme)
    const [demoRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM restaurants WHERE slug = ?",
      ["varsayilan-isletme"]
    );
    const demoBizId = demoRows.length > 0 ? demoRows[0].id : null;

    // Delete all related data for non-default restaurants
    if (demoBizId) {
      // Get IDs of restaurants to delete
      const [restaurantIds] = await conn.query<mysql.RowDataPacket[]>(
        "SELECT id FROM restaurants WHERE id != ?",
        [demoBizId]
      );

      for (const row of restaurantIds) {
        const rid = row.id;
        // Delete all related data
        await conn.query("DELETE FROM categories WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM products WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM orders WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM tables WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM users WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM restaurant_domains WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM restaurant_slug_redirects WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM audit_logs WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM subscriptions WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM payment_methods WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM payments WHERE restaurant_id = ?", [rid]);
        await conn.query("DELETE FROM restaurant_plugins WHERE restaurant_id = ?", [rid]);
      }

      // Delete the restaurants themselves
      await conn.query("DELETE FROM restaurants WHERE id != ?", [demoBizId]);
      console.log("✓ Deleted all demo restaurants (kept varsayilan-isletme)");
    }

    // Delete all licenses
    await conn.query("DELETE FROM licenses");
    console.log("✓ Deleted all licenses");

    // Delete all license activities
    await conn.query("DELETE FROM license_activities");
    console.log("✓ Deleted all license activities");

    // Delete all admin notifications
    await conn.query("DELETE FROM admin_notifications");
    console.log("✓ Deleted all admin notifications");

    // Delete all pending payments
    await conn.query("DELETE FROM pending_payments");
    console.log("✓ Deleted all pending payments");

    // Re-enable foreign key checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n✓ Demo data cleanup completed successfully!");
    console.log("  - Templates: KEPT");
    console.log("  - Demo sites: KEPT");
    console.log("  - Default restaurant (varsayilan-isletme): KEPT");
    console.log("  - All other demo data: DELETED");
  } catch (error) {
    console.error("Error cleaning demo data:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
