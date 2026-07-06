import java.sql.*;
public class InspectDimMasters {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      try (PreparedStatement ps = con.prepareStatement("select id, name, is_active from dimension_masters order by id"); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong(1)+"\t"+rs.getString(2)+"\tactive="+rs.getBoolean(3));
        }
      }
    }
  }
}
