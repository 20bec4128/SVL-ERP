import java.sql.*;
public class InspectPfc {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:postgresql://localhost:5432/nexorcrm";
    String user = "postgres";
    String pass = "4658";
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection(url, user, pass)) {
      String sql = """
        select st.id, st.name,
               max(case when p.field_key='size' then coalesce(p.custom_dimensions::text,'null') end) as size_dims,
               max(case when p.field_key='size' then coalesce(p.custom_dimension_unit,'') end) as size_unit,
               string_agg(case when p.field_key in ('length','width','height','depth') then p.field_key end, ',' order by p.display_order) as standalone_dims
        from product_field_configs p
        join service_types st on st.id = p.service_type_id
        where p.is_active = true
        group by st.id, st.name
        having max(case when p.field_key='size' then 1 else 0 end) = 1
           and count(case when p.field_key in ('length','width','height','depth') then 1 end) > 0
        order by st.id
      """;
      try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          System.out.println(rs.getLong("id") + "\t" + rs.getString("name") + "\t" + rs.getString("size_dims") + "\t" + rs.getString("size_unit") + "\t" + rs.getString("standalone_dims"));
        }
      }
    }
  }
}
