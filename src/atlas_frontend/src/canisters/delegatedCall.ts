interface UnwrapCallArgs<T> {call: Promise<{Ok: T} | {Err: unknown}>, errMsg: string}
export const unwrapCall = async<T> ({call, errMsg}: UnwrapCallArgs<T>) => {
    const res = await call
    if (!res) throw errMsg

    if ("Ok" in res) {
    return res.Ok
    } else if ("Err" in res) {
    throw res.Err
    }
}