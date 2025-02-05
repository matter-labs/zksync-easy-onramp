/* eslint-disable @stylistic/quotes */
import type { MigrationInterface, QueryRunner, } from "typeorm";

export class Initial1738613927423 implements MigrationInterface {
  name = 'Initial1738613927423';

  public async up(queryRunner: QueryRunner,): Promise<void> {
    await queryRunner.query(`CREATE TABLE "token" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "address" character varying(42) NOT NULL, "chainId" integer NOT NULL, "decimals" integer NOT NULL, "symbol" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_294a189de3c92b7ec61d926343f" UNIQUE ("address", "chainId"), CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`,);
    await queryRunner.query(`CREATE TYPE "public"."supported_token_type_enum" AS ENUM('buy', 'sell')`,);
    await queryRunner.query(`CREATE TABLE "supported_token" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "providerKey" character varying(32) NOT NULL, "tokenId" integer NOT NULL, "type" "public"."supported_token_type_enum" NOT NULL, CONSTRAINT "PK_6bc04e5ed4b87612cb57f11fa28" PRIMARY KEY ("id"))`,);
    await queryRunner.query(`CREATE INDEX "IDX_5d5fe56413571a1d557b7d24c8" ON "supported_token" ("providerKey", "tokenId", "type") `,);
    await queryRunner.query(`CREATE TYPE "public"."provider_type_enum" AS ENUM('cex', 'onramp')`,);
    await queryRunner.query(`CREATE TABLE "provider" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying(32) NOT NULL, "name" character varying NOT NULL, "iconUrl" character varying NOT NULL, "type" "public"."provider_type_enum" NOT NULL, CONSTRAINT "PK_44b3d97c5e6d7af2dc75c08cb73" PRIMARY KEY ("key"))`,);
    await queryRunner.query(`CREATE TYPE "public"."payment_option_paymenttype_enum" AS ENUM('credit_card', 'apple_pay_credit', 'google_pay_credit', 'debit_card', 'apple_pay_debit', 'google_pay_debit', 'wire', 'pix', 'sepa', 'ach', 'koywe')`,);
    await queryRunner.query(`CREATE TABLE "payment_option" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "providerKey" character varying(32) NOT NULL, "paymentType" "public"."payment_option_paymenttype_enum" NOT NULL, "countryCode" character varying(2), CONSTRAINT "PK_7a1b949deefa67a9a31dd1c9110" PRIMARY KEY ("id"))`,);
    await queryRunner.query(`CREATE INDEX "IDX_959f1f605e35acaefd3bee3901" ON "payment_option" ("providerKey", "countryCode") `,);
    await queryRunner.query(`ALTER TABLE "supported_token" ADD CONSTRAINT "FK_060e1d69c71900a6c55ac3c5dbf" FOREIGN KEY ("providerKey") REFERENCES "provider"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`,);
    await queryRunner.query(`ALTER TABLE "supported_token" ADD CONSTRAINT "FK_13878666830d772c121bf29d556" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,);
    await queryRunner.query(`ALTER TABLE "payment_option" ADD CONSTRAINT "FK_708a9468eaf199a487d3912f7de" FOREIGN KEY ("providerKey") REFERENCES "provider"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`,);
  }

  public async down(queryRunner: QueryRunner,): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_option" DROP CONSTRAINT "FK_708a9468eaf199a487d3912f7de"`,);
    await queryRunner.query(`ALTER TABLE "supported_token" DROP CONSTRAINT "FK_13878666830d772c121bf29d556"`,);
    await queryRunner.query(`ALTER TABLE "supported_token" DROP CONSTRAINT "FK_060e1d69c71900a6c55ac3c5dbf"`,);
    await queryRunner.query(`DROP INDEX "public"."IDX_959f1f605e35acaefd3bee3901"`,);
    await queryRunner.query(`DROP TABLE "payment_option"`,);
    await queryRunner.query(`DROP TYPE "public"."payment_option_paymenttype_enum"`,);
    await queryRunner.query(`DROP TABLE "provider"`,);
    await queryRunner.query(`DROP TYPE "public"."provider_type_enum"`,);
    await queryRunner.query(`DROP INDEX "public"."IDX_5d5fe56413571a1d557b7d24c8"`,);
    await queryRunner.query(`DROP TABLE "supported_token"`,);
    await queryRunner.query(`DROP TYPE "public"."supported_token_type_enum"`,);
    await queryRunner.query(`DROP TABLE "token"`,);
  }
}
