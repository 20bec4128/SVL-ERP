import java.sql.*;
public class InspectService1 {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      String sql = """
        select st.id as service_type_id, st.name as service_type_name,
               p.id, p.field_key, p.label, coalesce(p.custom_dimensions::text,'null') as dims
        from product_field_configs p
        join service_types st on st.id = p.service_type_id
        where p.is_active = true and st.id in (1,53)
        order by st.id, p.display_order, p.id
      """;
      try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong(1)+"\t"+rs.getString(2)+"\tfield#"+rs.getLong(3)+"\t"+rs.getString(4)+"\t"+rs.getString(5)+"\t"+rs.getString(6));
        }
      }
    }
  }
}
