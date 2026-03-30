import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO xác nhận thanh toán chuyển khoản (Admin)
 */
export class ConfirmBankTransferDto {
  @ApiPropertyOptional({ description: 'Ghi chú xác nhận' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * MoMo IPN callback DTO — dữ liệu MoMo gửi về qua webhook
 */
export class MomoIpnDto {
  @ApiProperty()
  @IsString()
  partnerCode!: string;

  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  requestId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  @IsString()
  orderInfo!: string;

  @ApiProperty()
  @IsString()
  orderType!: string;

  @ApiProperty()
  @IsString()
  transId!: string;

  @ApiProperty()
  resultCode!: number;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsString()
  payType!: string;

  @ApiProperty()
  responseTime!: number;

  @ApiProperty()
  @IsString()
  extraData!: string;

  @ApiProperty()
  @IsString()
  signature!: string;
}
