import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ApiPermissionTypes } from "../ApiPermissionAssignments.js";
import { ApiUserInfo } from "./ApiUserInfo.js";

@Entity("api_permissions")
export class ApiPermissionAssignment {
  @Column()
  @PrimaryColumn()
  guild_id: string;

  @Column({ type: String })
  @PrimaryColumn()
  type: ApiPermissionTypes;

  @Column()
  @PrimaryColumn()
  target_id: string;

  @Column("simple-array")
  permissions: string[];

  @Column({ type: String, nullable: true })
  expires_at: string | null;

  @ManyToOne(() => ApiUserInfo, (userInfo) => userInfo.permissionAssignments)
  @JoinColumn({ name: "target_id" })
  userInfo: ApiUserInfo;
}
