import java.sql.*;
public class InspectQuotations {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      System.out.println("--- Leads ---");
      try (PreparedStatement ps = con.prepareStatement("select id, name, company from leads order by id desc limit 20"); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println("ID: " + rs.getLong(1) + " | Name: " + rs.getString(2) + " | Company: " + rs.getString(3));
        }
      }
    }
  }
}
