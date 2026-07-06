import java.sql.*;
public class InspectSizeDims {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      String sql = """
        select st.id, st.name, p.id, p.custom_dimensions::text as dims, p.custom_dimension_unit, p.custom_size_mode
        from product_field_configs p
        join service_types st on st.id = p.service_type_id
        where p.is_active = true and p.field_key = 'size'
        order by st.id
      """;
      try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong(1)+"\t"+rs.getString(2)+"\tfield#"+rs.getLong(3)+"\t"+rs.getString(4)+"\t"+rs.getString(5)+"\t"+rs.getString(6));
        }
      }
    }
  }
}
