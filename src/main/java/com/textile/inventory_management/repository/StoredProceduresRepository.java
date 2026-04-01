package com.textile.inventory_management.repository;

import com.textile.inventory_management.dto.*;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class StoredProceduresRepository {
    private final NamedParameterJdbcTemplate jdbc;
    private static final int REORDER_LEVEL = 20;

    public StoredProceduresRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<ProductDto> PRODUCT_ROW_MAPPER = (rs, rowNum) -> {
        ProductDto p = new ProductDto();
        p.setProductId((Integer) rs.getObject("ProductID"));
        p.setProductCode(rs.getString("ProductCode"));
        p.setProductName(rs.getString("ProductName"));
        p.setCategoryId((Integer) rs.getObject("CategoryID"));
        p.setSupplierId((Integer) rs.getObject("SupplierID"));
        p.setUnitPrice(rs.getBigDecimal("UnitPrice"));
        p.setStockQuantity((Integer) rs.getObject("StockQuantity"));
        p.setReorderLevel((Integer) rs.getObject("ReorderLevel"));
        p.setCategoryName(rs.getString("CategoryName"));
        p.setSupplierName(rs.getString("SupplierName"));
        return p;
    };

    private static final RowMapper<LowStockAlertDto> ALERT_ROW_MAPPER = (rs, rowNum) -> {
        LowStockAlertDto a = new LowStockAlertDto();
        a.setProductId((Integer) rs.getObject("ProductID"));
        a.setProductCode(rs.getString("ProductCode"));
        a.setProductName(rs.getString("ProductName"));
        a.setStockQuantity((Integer) rs.getObject("StockQuantity"));
        a.setReorderLevel((Integer) rs.getObject("ReorderLevel"));
        a.setSupplierName(rs.getString("SupplierName"));
        return a;
    };

    private static final RowMapper<InventoryValueDto> SUMMARY_ROW_MAPPER = (rs, rowNum) -> {
        InventoryValueDto v = new InventoryValueDto();
        v.setTotalProducts((Integer) rs.getObject("TotalProducts"));
        v.setTotalItems((Integer) rs.getObject("TotalItems"));
        v.setTotalInventoryValue(rs.getBigDecimal("TotalInventoryValue"));
        v.setPotentialProfit(rs.getBigDecimal("PotentialProfit"));
        return v;
    };

    public List<ProductDto> getAllProducts() {
        String sql = """
                SELECT p.ProductID,
                       CAST(p.ProductID AS nvarchar(50)) AS ProductCode,
                       p.ProductName,
                       p.CategoryID,
                       p.SupplierID,
                       p.Price AS UnitPrice,
                       p.StockQuantity,
                       CAST(20 AS int) AS ReorderLevel,
                       c.CategoryName,
                       s.SupplierName
                FROM dbo.Products p
                LEFT JOIN dbo.Categories c ON c.CategoryID = p.CategoryID
                LEFT JOIN dbo.Suppliers s ON s.SupplierID = p.SupplierID
                ORDER BY p.ProductID DESC
                """;
        return jdbc.getJdbcTemplate().query(sql, PRODUCT_ROW_MAPPER);
    }

    public ProductDto getProductById(int productId) {
        MapSqlParameterSource params = new MapSqlParameterSource("ProductID", productId);
        String sql = """
                SELECT p.ProductID,
                       CAST(p.ProductID AS nvarchar(50)) AS ProductCode,
                       p.ProductName,
                       p.CategoryID,
                       p.SupplierID,
                       p.Price AS UnitPrice,
                       p.StockQuantity,
                       CAST(20 AS int) AS ReorderLevel,
                       c.CategoryName,
                       s.SupplierName
                FROM dbo.Products p
                LEFT JOIN dbo.Categories c ON c.CategoryID = p.CategoryID
                LEFT JOIN dbo.Suppliers s ON s.SupplierID = p.SupplierID
                WHERE p.ProductID = :ProductID
                """;
        List<ProductDto> rows = jdbc.query(sql, params, PRODUCT_ROW_MAPPER);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<ProductDto> searchProducts(String searchTerm) {
        MapSqlParameterSource params = new MapSqlParameterSource("SearchTerm", "%" + (searchTerm == null ? "" : searchTerm.trim()) + "%");
        String sql = """
                SELECT p.ProductID,
                       CAST(p.ProductID AS nvarchar(50)) AS ProductCode,
                       p.ProductName,
                       p.CategoryID,
                       p.SupplierID,
                       p.Price AS UnitPrice,
                       p.StockQuantity,
                       CAST(20 AS int) AS ReorderLevel,
                       c.CategoryName,
                       s.SupplierName
                FROM dbo.Products p
                LEFT JOIN dbo.Categories c ON c.CategoryID = p.CategoryID
                LEFT JOIN dbo.Suppliers s ON s.SupplierID = p.SupplierID
                WHERE :SearchTerm = '%%'
                   OR p.ProductName LIKE :SearchTerm
                   OR CAST(p.ProductID AS nvarchar(50)) LIKE :SearchTerm
                   OR c.CategoryName LIKE :SearchTerm
                   OR s.SupplierName LIKE :SearchTerm
                ORDER BY p.ProductID DESC
                """;
        return jdbc.query(sql, params, PRODUCT_ROW_MAPPER);
    }

    public int createProduct(CreateProductRequest req) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("ProductName", req.getProductName())
                .addValue("CategoryID", req.getCategoryId())
                .addValue("SupplierID", req.getSupplierId())
                .addValue("UnitPrice", req.getUnitPrice())
                .addValue("StockQuantity", req.getStockQuantity() == null ? 0 : req.getStockQuantity());
        String sql = """
                INSERT INTO dbo.Products (ProductName, CategoryID, SupplierID, Price, StockQuantity, CreatedAt)
                VALUES (:ProductName, :CategoryID, :SupplierID, :UnitPrice, :StockQuantity, SYSDATETIME());
                SELECT CAST(SCOPE_IDENTITY() AS int)
                """;
        Integer id = jdbc.queryForObject(sql, params, Integer.class);
        return id == null ? 0 : id;
    }

    public ProductDto updateProduct(int productId, UpdateProductRequest req) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("ProductID", productId)
                .addValue("ProductName", req.getProductName())
                .addValue("CategoryID", req.getCategoryId())
                .addValue("SupplierID", req.getSupplierId())
                .addValue("UnitPrice", req.getUnitPrice());
        int updated = jdbc.update("""
                UPDATE dbo.Products
                SET ProductName = :ProductName,
                    CategoryID = :CategoryID,
                    SupplierID = :SupplierID,
                    Price = :UnitPrice
                WHERE ProductID = :ProductID
                """, params);
        return updated == 0 ? null : getProductById(productId);
    }

    public void deleteProduct(int productId) {
        jdbc.update("DELETE FROM dbo.Products WHERE ProductID = :ProductID", new MapSqlParameterSource("ProductID", productId));
    }

    public void addStock(int productId, StockAdjustRequest req) throws DataAccessException {
        jdbc.update("UPDATE dbo.Products SET StockQuantity = StockQuantity + :Quantity WHERE ProductID = :ProductID",
                new MapSqlParameterSource().addValue("ProductID", productId).addValue("Quantity", req.getQuantity()));
    }

    public void removeStock(int productId, StockAdjustRequest req) throws DataAccessException {
        Integer current = jdbc.queryForObject("SELECT StockQuantity FROM dbo.Products WHERE ProductID=:ProductID",
                new MapSqlParameterSource("ProductID", productId), Integer.class);
        if (current == null) throw new DataAccessException("Product not found") {};
        if (current < req.getQuantity()) throw new DataAccessException("Insufficient stock") {};
        jdbc.update("UPDATE dbo.Products SET StockQuantity = StockQuantity - :Quantity WHERE ProductID = :ProductID",
                new MapSqlParameterSource().addValue("ProductID", productId).addValue("Quantity", req.getQuantity()));
    }

    public List<LowStockAlertDto> getLowStockAlerts() {
        String sql = """
                SELECT p.ProductID,
                       CAST(p.ProductID AS nvarchar(50)) AS ProductCode,
                       p.ProductName,
                       p.StockQuantity,
                       CAST(20 AS int) AS ReorderLevel,
                       s.SupplierName
                FROM dbo.Products p
                LEFT JOIN dbo.Suppliers s ON s.SupplierID = p.SupplierID
                WHERE p.StockQuantity < :ReorderLevel
                ORDER BY p.StockQuantity ASC
                """;
        return jdbc.query(sql, new MapSqlParameterSource("ReorderLevel", REORDER_LEVEL), ALERT_ROW_MAPPER);
    }

    public InventoryValueDto getInventoryValue() {
        String sql = """
                SELECT COUNT(*) AS TotalProducts,
                       COALESCE(SUM(StockQuantity), 0) AS TotalItems,
                       COALESCE(SUM(StockQuantity * Price), 0) AS TotalInventoryValue,
                       CAST(0 AS decimal(18,2)) AS PotentialProfit
                FROM dbo.Products
                """;
        List<InventoryValueDto> rows = jdbc.getJdbcTemplate().query(sql, SUMMARY_ROW_MAPPER);
        return rows.isEmpty() ? new InventoryValueDto() : rows.get(0);
    }
}
