-- AlterTable
CREATE SEQUENCE token_tokennumber_seq;
ALTER TABLE "Token" ALTER COLUMN "tokenNumber" SET DEFAULT nextval('token_tokennumber_seq');
ALTER SEQUENCE token_tokennumber_seq OWNED BY "Token"."tokenNumber";
