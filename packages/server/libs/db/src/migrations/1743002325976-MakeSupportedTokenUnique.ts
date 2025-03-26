import type { MigrationInterface, QueryRunner, } from "typeorm";

export class MakeSupportedTokenUnique1743002325976 implements MigrationInterface {
  name = "MakeSupportedTokenUnique1743002325976";

  public async up(queryRunner: QueryRunner,): Promise<void> {
    // Remove existing duplicates, keeping the first one by ID
    await queryRunner.query(`
      DELETE FROM supported_token
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY "providerKey", "tokenId", "type"
                   ORDER BY id
                 ) AS row_num
          FROM supported_token
        ) t
        WHERE t.row_num > 1
      );
    `,);

    // Drop and recreate the index as UNIQUE
    await queryRunner.query("DROP INDEX \"public\".\"IDX_5d5fe56413571a1d557b7d24c8\"",);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_5d5fe56413571a1d557b7d24c8"
      ON "supported_token" ("providerKey", "tokenId", "type")
    `,);
  }

  public async down(queryRunner: QueryRunner,): Promise<void> {
    await queryRunner.query("DROP INDEX \"public\".\"IDX_5d5fe56413571a1d557b7d24c8\"",);
    await queryRunner.query(`
      CREATE INDEX "IDX_5d5fe56413571a1d557b7d24c8"
      ON "supported_token" ("providerKey", "tokenId", "type")
    `,);
  }
}