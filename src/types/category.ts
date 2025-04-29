export interface Category {
  id: string;
  title: string;
  icon?: string[];
  iconColor?: string;
  color: string;
  children?: Category[];
}
