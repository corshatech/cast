import useSWR from 'swr';

import { GetUsersResponse } from '@/lib/users';
import { TypedFetch } from '@/lib/TypedFetch';

export default function GetUsersDemo() {
  const { data, isLoading, error } = useSWR('/api/getUsers', TypedFetch(GetUsersResponse));
  return <p>{JSON.stringify({data, isLoading, error})}</p>;
}
