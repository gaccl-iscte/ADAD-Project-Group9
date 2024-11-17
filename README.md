# ADAD-Project-Group9

## Link for the documentation
https://documenter.getpostman.com/view/39520152/2sAYBPnF6s

### Members
```
98616 - Bernardo Assunção - METI-PL-A1 - Bernardo_Assuncao@iscte-iul.pt
98931 - Filipe Vasconcelos - METI-PL-A1 - Filipe_Vasconcelos@iscte-iul.pt
98624 - Gonçalo Lobato - METI-PL-A1 - Goncalo_Lobato@iscte-iul.pt
99435 - Nuno Teixeira - METI-PL-A1 - Nuno_Oliveira_Teixiera@iscte-iul.pt
99227 - Tomás Catarino - METI-A1 - Tomas_Catarino@iscte-iul.pt
```

### Command do add price to books at collection "books":
```mongodb
db["books"].updateMany(
  {},
  [
    {
      $set: {
        price: {
          $round: [{ $multiply: [{ $rand: {} }, 100] }, 2]
        }
      }
    }
  ]
);
```
### Command to create index for geospacial queries at collection "livrarias"
```mongodb
db.livrarias.createIndex({ "geometry": "2dsphere" });
```
