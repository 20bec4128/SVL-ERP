import java.sql.*;
public class VerifyService53 {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      String sql = """
        select st.id as service_type_id, st.name as service_type_name,
               p.id, p.field_key, p.label,
               coalesce(p.custom_dimensions::text,'null') as custom_dimensions,
               coalesce(p.custom_dimension_unit,'') as custom_dimension_unit,
               coalesce(p.custom_size_mode,'') as custom_size_mode
        from product_field_configs p
        join service_types st on st.id = p.service_type_id
        where p.is_active = true and st.id = 53
        order by p.display_order, p.id
      """;
      try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong(1)+"\t"+rs.getString(2)+"\tfield#"+rs.getLong(3)+"\t"+rs.getString(4)+"\t"+rs.getString(5)+"\t"+rs.getString(6)+"\t"+rs.getString(7)+"\t"+rs.getString(8));
        }
      }
    }
  }
}
