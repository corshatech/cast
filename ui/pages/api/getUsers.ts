import { GetUsersResponse } from '@/lib/users';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse<GetUsersResponse>,
) => {
  res.send([{
    username: 'mary',
    age: 74,
  }, {
    username: 'joe',
    age: 21,
  }]);
}
export default handler;
