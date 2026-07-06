import java.sql.*;
public class FixNormalVisitingCardDims {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/nexorcrm", "postgres", "4658")) {
      con.setAutoCommit(false);
      try (PreparedStatement updateSize = con.prepareStatement(
              "update product_field_configs set custom_dimensions = ?::jsonb, custom_dimension_unit = ?, custom_size_mode = null, updated_at = now() where service_type_id = 53 and is_active = true and field_key = 'size'");
           PreparedStatement clearOther = con.prepareStatement(
              "update product_field_configs set custom_dimensions = null, custom_dimension_unit = null, custom_size_mode = null, updated_at = now() where service_type_id = 53 and is_active = true and field_key <> 'size' and (custom_dimensions is not null or custom_dimension_unit is not null or custom_size_mode is not null)")
      ) {
        updateSize.setString(1, "[\"Length\",\"Depth\"]");
        updateSize.setString(2, "mm");
        int updatedSize = updateSize.executeUpdate();
        int clearedOthers = clearOther.executeUpdate();
        con.commit();
        System.out.println("updated_size=" + updatedSize);
        System.out.println("cleared_other_fields=" + clearedOthers);
      } catch (Exception ex) {
        con.rollback();
        throw ex;
      }
    }
  }
}
