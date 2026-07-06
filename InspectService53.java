import java.sql.*;
public class InspectService53 {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      String sql = """
        select st.id as service_type_id, st.name as service_type_name,
               p.id, p.field_key, p.label, p.field_type, p.is_hidden, p.allow_custom,
               coalesce(p.custom_dimensions::text,'null') as custom_dimensions,
               coalesce(p.custom_dimension_unit,'') as custom_dimension_unit,
               coalesce(p.custom_size_mode,'') as custom_size_mode,
               p.display_order
        from product_field_configs p
        join service_types st on st.id = p.service_type_id
        where p.is_active = true and st.id = 53
        order by p.display_order, p.id
      """;
      try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong("service_type_id") + "\t" + rs.getString("service_type_name") + "\tfield#" + rs.getLong("id") + "\t" + rs.getString("field_key") + "\t" + rs.getString("label") + "\t" + rs.getString("field_type") + "\thidden=" + rs.getBoolean("is_hidden") + "\tcustom=" + rs.getBoolean("allow_custom") + "\tdims=" + rs.getString("custom_dimensions") + "\tunit=" + rs.getString("custom_dimension_unit") + "\tmode=" + rs.getString("custom_size_mode"));
        }
      }
    }
  }
}
