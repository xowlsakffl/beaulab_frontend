import type { UserInfoCardProps } from "./UserInfoCard";
import UserInfoCard from "./UserInfoCard";

export default function UserAddressCard(props: UserInfoCardProps) {
  return <UserInfoCard title={props.title ?? "추가 정보"} items={props.items} actions={props.actions} emptyText={props.emptyText} />;
}
