import functions from '@react-native-firebase/functions';

export async function callFunction<TData, TResult>(name: string, data: TData): Promise<TResult> {
  const res = await functions().httpsCallable(name)(data as any);
  return res.data as TResult;
}

