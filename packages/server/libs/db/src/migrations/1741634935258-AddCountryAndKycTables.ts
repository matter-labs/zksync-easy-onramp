import type { MigrationInterface, QueryRunner, } from "typeorm";

export class AddCountryAndKycTables1741634935258 implements MigrationInterface {
  name = "AddCountryAndKycTables1741634935258";

  public async up(queryRunner: QueryRunner,): Promise<void> {
    await queryRunner.query("CREATE TABLE \"supported_country\" (\"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"id\" SERIAL NOT NULL, \"providerKey\" character varying(32) NOT NULL, \"countryCode\" character varying(2) NOT NULL, CONSTRAINT \"PK_ef8fb2bf728d666bb4a98601456\" PRIMARY KEY (\"id\"))",);
    await queryRunner.query("CREATE TYPE \"public\".\"supported_kyc_kyclevel_enum\" AS ENUM('no_kyc', 'basic', 'document_based')",);
    await queryRunner.query("CREATE TABLE \"supported_kyc\" (\"createdAt\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"id\" SERIAL NOT NULL, \"providerKey\" character varying(32) NOT NULL, \"kycLevel\" \"public\".\"supported_kyc_kyclevel_enum\" NOT NULL, CONSTRAINT \"PK_af712f7e5712407adf8f12e889e\" PRIMARY KEY (\"id\"))",);
    await queryRunner.query("ALTER TABLE \"supported_country\" ADD CONSTRAINT \"FK_354fd589938840971f30de0116d\" FOREIGN KEY (\"providerKey\") REFERENCES \"provider\"(\"key\") ON DELETE CASCADE ON UPDATE NO ACTION",);
    await queryRunner.query("ALTER TABLE \"supported_kyc\" ADD CONSTRAINT \"FK_ddc4d6ff7c5dd01ecc54606bde5\" FOREIGN KEY (\"providerKey\") REFERENCES \"provider\"(\"key\") ON DELETE CASCADE ON UPDATE NO ACTION",);
  }

  public async down(queryRunner: QueryRunner,): Promise<void> {
    await queryRunner.query("ALTER TABLE \"supported_kyc\" DROP CONSTRAINT \"FK_ddc4d6ff7c5dd01ecc54606bde5\"",);
    await queryRunner.query("ALTER TABLE \"supported_country\" DROP CONSTRAINT \"FK_354fd589938840971f30de0116d\"",);
    await queryRunner.query("DROP TABLE \"supported_kyc\"",);
    await queryRunner.query("DROP TYPE \"public\".\"supported_kyc_kyclevel_enum\"",);
    await queryRunner.query("DROP TABLE \"supported_country\"",);
  }

}
