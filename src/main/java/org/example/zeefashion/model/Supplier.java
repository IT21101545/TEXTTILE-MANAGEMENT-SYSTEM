package org.example.zeefashion.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String contact;
    private String email;
    private String address;
    private String materialType; // e.g. "Fabric", "Buttons"
    private String status = "ACTIVE";
    private Integer totalSupplied = 0;

    @ManyToMany
    @JoinTable(
        name = "supplier_materials",
        joinColumns = @JoinColumn(name = "supplier_id"),
        inverseJoinColumns = @JoinColumn(name = "material_id")
    )
    private Set<Material> suppliedMaterials = new HashSet<>();

    public Supplier() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getMaterialType() { return materialType; }
    public void setMaterialType(String materialType) { this.materialType = materialType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTotalSupplied() { return totalSupplied; }
    public void setTotalSupplied(Integer totalSupplied) { this.totalSupplied = totalSupplied; }

    public Set<Material> getSuppliedMaterials() { return suppliedMaterials; }
    public void setSuppliedMaterials(Set<Material> suppliedMaterials) { this.suppliedMaterials = suppliedMaterials; }
}
