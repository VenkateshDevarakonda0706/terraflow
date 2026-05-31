import { IsString, IsNumber, Min, Max, MinLength, MaxLength, IsArray, IsOptional, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @IsIn(['PUBLIC', 'FRIENDS', 'PRIVATE'])
  visibility!: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[] = [];
}
