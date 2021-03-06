import {Entity, createConnection, PrimaryGeneratedColumn, getConnection, ManyToMany, JoinTable} from "typeorm"
import {Subscriber, EncryptedColumn} from './index'
import 'reflect-metadata'

@Entity()
class Test{
  @PrimaryGeneratedColumn()
  id: number

  @EncryptedColumn({
    type: "varchar",
    nullable: false,
    encrypt: {
      key: "d85117047fd06d3afa79b6e44ee3a52eb426fc24c3a2e3667732e8da0342b4da",
      algorithm: "aes-256-cbc",
      ivLength: 16
    }
  })
  secret: string

  @ManyToMany(type => Second, entity => entity.parents, { cascade: true })
  @JoinTable()
  children: Second[]
}

@Entity()
class Second{
  @PrimaryGeneratedColumn()
  id: number

  @ManyToMany(type => Test, test => test.children)
  parents: Test[]
}

beforeAll(async () => {
  await createConnection({
    type: 'sqljs',
    entities: [Test, Second],
    subscribers: [Subscriber],
    synchronize: true
  })
})

test('It should encrypt data', async () => {
  let entity = new Test
  entity.secret = 'testing'

  let connection = getConnection()
  let repository = connection.getRepository(Test)

  await repository.save(entity)

  expect(entity.secret).not.toBe('test')
})

test('It should fetch encrypted data', async () => {
  let connection = getConnection()
  let repository = connection.getRepository(Test)

  let t = await repository.findOneOrFail()

  expect(t.secret).toBe('testing')
})

test('it should update data', async () => {
  let connection = getConnection()
  let repository = connection.getRepository(Test)

  let t = await repository.findOneOrFail()

  expect(t.secret).toBe('testing')

  t.secret = 'tested'

  await repository.save(t)

  let u = await repository.findOneOrFail()

  expect(u.secret).toBe('tested')
})

test('N:N relation should be saved', async () => {
  let connection = getConnection()
  let repository = connection.getRepository(Test)

  let t = await repository.findOneOrFail()

  t.children = [new Second, new Second]

  await repository.save(t)
})

test('N:N relation should be joined', async () => {
  let connection = getConnection()
  let repository = connection.getRepository(Test)

  let t = await repository.findOneOrFail({ relations: ['children'] })

  expect(t.children.length).toBe(2)
})
