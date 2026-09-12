export class Zone {
  constructor(
    public readonly id: number,
    public readonly regionId: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly sortOrder: number,
  ) {}
}
